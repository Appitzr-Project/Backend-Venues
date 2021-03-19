import { Response, NextFunction } from "express";
import { body, validationResult, ValidationChain } from 'express-validator';
import { venueAttribute, cultureCategory, venueProfile, venueProfileModel } from "@appitzr-project/db-model";
import { RequestAuthenticated, userDetail } from "@base-pojokan/auth-aws-cognito";
import * as AWS from 'aws-sdk';

// declare database dynamodb
const ddb = new AWS.DynamoDB.DocumentClient({ endpoint: process.env.DYNAMODB_LOCAL, convertEmptyValues: true });

export const venuesGet = async (
  req: RequestAuthenticated,
  res: Response,
  next: NextFunction
) => {
  try {
      const params = { 
          TableName: venueProfileModel.TableName,
          AttributesToGet: venueAttribute
      };

      const queryDB = await ddb.scan(params).promise();

      // return result
      return res.status(200).json({
          code: 200,
          message: 'success',
          data: queryDB?.Items
      });

  } catch (e) {
    // return default error
    next(e);
  }
};

export const venuesGetDetails = async (
  req: RequestAuthenticated,
  res: Response,
  next: NextFunction
) => {
  try {
    const params : AWS.DynamoDB.DocumentClient.GetItemInput = { 
      TableName: venueProfileModel.TableName,
      Key: {
        venueEmail: "test@test.com",
        cognitoId: "98291e2e-1078-4b10-9c9f-d75e2420d2c1"
      },
    };

      const queryDB = await ddb.get(params).promise();

      // return result
      return res.status(200).json({
          code: 200,
          message: 'success',
          data: queryDB?.Item
      });

  } catch (e) {
    // return default error
    next(e);
  }
};