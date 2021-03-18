import { Response, NextFunction } from "express";
import { body, validationResult, ValidationChain } from 'express-validator';
import { venueProfile, venueProfileModel } from "@appitzr-project/db-model";
import { RequestAuthenticated, userDetail } from "@base-pojokan/auth-aws-cognito";
import * as AWS from 'aws-sdk';

// declare database dynamodb
const ddb = new AWS.DynamoDB.DocumentClient({ endpoint: process.env.DYNAMODB_LOCAL, convertEmptyValues: true });

export const cultureCategoryValidate : ValidationChain[] = [
    body('cultureCategory').notEmpty().isString()
  ];

export const cultureGet = async (
    req: RequestAuthenticated,
    res: Response,
    next: NextFunction
  ) => {
    try {
      // validate group
      userDetail(req);
  
      // exapress validate input
      const errors = validationResult(req);
      if(!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      // get input
      const userReq : venueProfile = req.body;

        // dynamodb parameter
        const paramDB = {
            TableName: venueProfileModel.TableName,
            FilterExpression: "#cc = :data",
            ExpressionAttributeNames: {
                "#cc": "cultureCategory",
            },

            ExpressionAttributeValues: {
                ":data": userReq.cultureCategory,
            }
        }

        // query to database
        const queryDB = await ddb.scan(paramDB).promise();

      // return result
      return res.status(200).json({
        code: 200,
        message: 'success',
        data: queryDB
      });
  
    } catch (e) {
      /**
       * Return error kalau expression data udh ada
       */
       if(e?.code == 'ConditionalCheckFailedException') {
        next(new Error('Data Already Exist.!'));
      }
  
      // return default error
      next(e);
    }
  };