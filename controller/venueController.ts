import { Response, NextFunction } from "express";
import { venueAttribute, venueAttributePublic, venueProfileModel } from "@appitzr-project/db-model";
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
      const valNameVenue = req.query.nameVenue;
      const valCultureCategory = req.query.cultureCategory;

      var params = {};

      if (valNameVenue && valCultureCategory) { // check when filter name venue and culture category exist

        params = { 
          TableName: venueProfileModel.TableName,
          IndexName: "cultureCategoryIndex",
          KeyConditionExpression: "cultureCategory = :cultureCategory",
          FilterExpression: "contains(#venueName, :venueName)",
          ExpressionAttributeNames: {
              "#venueName": "venueName"
          },
          ExpressionAttributeValues: {
              ":venueName": valNameVenue,
              ":cultureCategory": valCultureCategory
          },
          ProjectionExpression: venueAttributePublic,
        };

        var queryDB = await ddb.query(params).promise();

      } else if (valNameVenue) { // check when filter name venue exist

        params = { 
          TableName: venueProfileModel.TableName,
          FilterExpression: "contains(#venueName, :venueName)",
          ExpressionAttributeNames: {
              "#venueName": "venueName",
          },
          ExpressionAttributeValues: {
              ":venueName": valNameVenue,
          },
          ProjectionExpression: venueAttributePublic,
        };

        var queryDB = await ddb.scan(params).promise();

      } else if (valCultureCategory) { // check when filter culture category exist

        params = { 
          TableName: venueProfileModel.TableName,
          IndexName: "cultureCategoryIndex",
          KeyConditionExpression: "cultureCategory = :cultureCategory",
          ExpressionAttributeValues: {
              ":cultureCategory": valCultureCategory
          },
          ProjectionExpression: venueAttributePublic,
        };

        var queryDB = await ddb.query(params).promise();

      } else { // else when filter name venue and culture category not exist

        params = { 
          TableName: venueProfileModel.TableName,
          AttributesToGet: venueAttributePublic
        };

        var queryDB = await ddb.scan(params).promise();
        
      }

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
        phoneNumber,
        address,
        postalCode,
        mapLong,
        mapLat,
        cultureCategory,
        productCategory,
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