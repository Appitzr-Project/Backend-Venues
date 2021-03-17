import { Response, NextFunction } from "express";
import { body, validationResult, ValidationChain } from 'express-validator';
import { userFavoritesModel, userFavorites } from "@appitzr-project/db-model";
import { RequestAuthenticated, validateGroup } from "@base-pojokan/auth-aws-cognito";
import * as AWS from 'aws-sdk';
import { v4 as uuidv4 } from 'uuid';

// declare database dynamodb
const ddb = new AWS.DynamoDB.DocumentClient({ endpoint: process.env.DYNAMODB_LOCAL, convertEmptyValues: true });

/**
 * Venue Profile Store Validation with Express Validator
 */
 export const favoriteStoreValidate : ValidationChain[] = [
    body('venueId').notEmpty().isString()
  ];

/**
 * Index Data Function
 *
 * @param req
 * @param res
 * @param next
 */
export const favoriteIndex = async (
  req: RequestAuthenticated,
  res: Response,
  next: NextFunction
) => {
  try {
    // validate group
    const userDetail = await validateGroup(req, "venue");

    // exapress validate input
    const errors = validationResult(req);
    if(!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // get input
    const user : userFavorites = req.body;

    // venue profile input with typescript definition
    const userInput : userFavorites = {
      id: uuidv4(),
      userId: userDetail?.sub,
      venueId: user.venueId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    // dynamodb parameter
    const paramsDB : AWS.DynamoDB.DocumentClient.PutItemInput = {
      TableName: userFavoritesModel.TableName,
      Item: userInput
    }

    // save data to database
    await ddb.put(paramsDB).promise();

    // return result
    return res.status(200).json({
      code: 200,
      message: 'success',
      data: paramsDB?.Item
    });

  } catch (e) {
    next(e);
  }
};
