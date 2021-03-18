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
        // validate group
        userDetail(req);

        // exapress validate input
        const errors = validationResult(req);
        if(!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

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