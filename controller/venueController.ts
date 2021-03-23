import { Response, NextFunction } from "express";
import { venueAttribute, venueProfileModel } from "@appitzr-project/db-model";
import { RequestAuthenticated } from "@base-pojokan/auth-aws-cognito";
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

    const idVenue = req.params.venueId;

    const params = { 
      TableName: venueProfileModel.TableName,
      IndexName: "idIndex",
      KeyConditionExpression: "id = :vi", 
      ExpressionAttributeValues: {                
        ":vi": idVenue              
      },
      ProjectionExpression: `
        id,
        venueName,
        venueEmail,
        bankBSB,
        bankName,
        bankAccountNo,
        phoneNumber,
        address,
        postalCode,
        mapLong,
        mapLat,
        cultureCategory,
        profilePicture,
        createdAt,
        updatedAt
      `,
      limit: 1
    };

      const queryDB = await ddb.query(params).promise();

      // return result
      return res.status(200).json({
          code: 200,
          message: 'success',
          data: queryDB?.Items[0]
      });

  } catch (e) {
    // return default error
    next(e);
  }
};