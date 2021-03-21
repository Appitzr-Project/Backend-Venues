import { Response, NextFunction} from "express";
import { body, validationResult, ValidationChain } from 'express-validator';
import { userFavoritesModel, userFavorites, userProfileModel } from "@appitzr-project/db-model";
import { RequestAuthenticated, userDetail } from "@base-pojokan/auth-aws-cognito";
import * as AWS from 'aws-sdk';
import { v4 as uuidv4 } from 'uuid';

// declare database dynamodb
const ddb = new AWS.DynamoDB.DocumentClient({ endpoint: process.env.DYNAMODB_LOCAL, convertEmptyValues: true });

/**
 * Venue Profile Store Validation with Express Validator
 */
export const favoriteStoreValidate : ValidationChain[] = [
  body('venueId').notEmpty().isString(),
  body('isBlocked').notEmpty().isBoolean()
];

export const favoriteUpdateValidate : ValidationChain[] = [
  body('isBlocked').notEmpty().isBoolean()
];

/**
 * Index Data Function
 *
 * @param req
 * @param res
 * @param next
 */

export const favoritesGet = async (
  req: RequestAuthenticated,
  res: Response,
  next: NextFunction
) => {
  try {
      // validate group
      const user = userDetail(req);

      // exapress validate input
      const errors = validationResult(req);
      if(!errors.isEmpty()) {
          return res.status(400).json({ errors: errors.array() });
      }

      // dynamodb parameter
      const paramDB : AWS.DynamoDB.DocumentClient.GetItemInput = {
        TableName: userProfileModel.TableName,
        Key: {
          email: user.email,
          cognitoId: user.sub
        },
        AttributesToGet: ["id"]
      }

      // query to database
      const getUser = await ddb.get(paramDB).promise();
      const getQuery = req.param('isBlocked');

      const params = { 
        TableName: userFavoritesModel.TableName,
        FilterExpression: "userId = :ui AND isBlocked = :ib",
        ExpressionAttributeValues: {
            ":ui": getUser?.Item.id,
            ":ib": (getQuery == "true")
        }
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

export const favoriteStore = async (
  req: RequestAuthenticated,
  res: Response,
  next: NextFunction
) => {
  try {
    // validate group
    const user = userDetail(req);

    // exapress validate input
    const errors = validationResult(req);
    if(!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // dynamodb parameter
    const paramDB : AWS.DynamoDB.DocumentClient.GetItemInput = {
      TableName: userProfileModel.TableName,
      Key: {
        email: user.email,
        cognitoId: user.sub
      },
      AttributesToGet: ["id"]
    }

    // query to database
    const getUser = await ddb.get(paramDB).promise();

    // get input
    const favorite : userFavorites = req.body;

    // venue Favorites input with typescript definition
    const userInput : userFavorites = {
      id: uuidv4(),
      userId: getUser?.Item.id,
      venueId: favorite.venueId,
      isBlocked: favorite.isBlocked,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    // dynamodb parameter
    const paramsDB : AWS.DynamoDB.DocumentClient.PutItemInput = {
      TableName: userFavoritesModel.TableName,
      Item: userInput,
      ConditionExpression: 'attribute_not_exists(venueId)'
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

export const getFavoriteByVenueId = async (
  req: RequestAuthenticated,
  res: Response,
  next: NextFunction
) => {
  try {

    const idVenue = req.param('venueId');

    const params = {
      TableName: userFavoritesModel.TableName,
      IndexName: "venueId-index",
      KeyConditionExpression: "venueId = :vi", 
      ExpressionAttributeValues: {                
        ":vi": idVenue              
      }
    }

    const getFavorite = await ddb.query(params).promise();

    // return result
    return res.status(200).json({
        code: 200,
        message: 'success',
        data: getFavorite?.Items
    });

  } catch (e) {
    // return default error
    next(e);
  }
};







export const favoriteDelete = async (
  req: RequestAuthenticated,
  res: Response,
  next: NextFunction
) => {
  try {
    // validate group
    const user = userDetail(req);

    // exapress validate input
    const errors = validationResult(req);
    if(!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // dynamodb parameter
    const paramDB : AWS.DynamoDB.DocumentClient.GetItemInput = {
      TableName: userProfileModel.TableName,
      Key: {
        email: user.email,
        cognitoId: user.sub
      },
      AttributesToGet: ['id']
    }

    // query to database
    const getUser = await ddb.get(paramDB).promise();

    // get input
    const idVenue = req.param("venueId");

    // dynamodb parameter
    const paramsGetIdFavorite = {
      TableName: userFavoritesModel.TableName,
      IndexName: "venueId-index",
      KeyConditionExpression: "venueId = :vi AND userId = :ui",
      ExpressionAttributeValues: {                
        ":vi": idVenue,
        ":ui": getUser?.Item.id
      },
      ProjectionExpression: "id",
      limit: 1
    }

    const getIdFavorite = await ddb.query(paramsGetIdFavorite).promise();

    const paramDel = {
      TableName: userFavoritesModel.TableName,
      Key: {
        id: getIdFavorite?.Items[0].id,
        userId: getUser?.Item.id
      }
    }

    // delete data to database
    await ddb.delete(paramDel).promise();

    // return result
    return res.status(200).json({
      code: 200,
      message: 'success'
    });

  } catch (e) {
    // return default error
    next(e);
  }
};

export const favoriteUpdate = async (
  req: RequestAuthenticated,
  res: Response,
  next: NextFunction
) => {
  try {
    // validate group
    const user = userDetail(req);

    // exapress validate input
    const errors = validationResult(req);
    if(!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // dynamodb parameter
    const paramDB : AWS.DynamoDB.DocumentClient.GetItemInput = {
      TableName: userProfileModel.TableName,
      Key: {
        email: user.email,
        cognitoId: user.sub
      },
      AttributesToGet: ['id']
    }

    // query to database
    const getUser = await ddb.get(paramDB).promise();

    // get input
    const idVenue = req.param("venueId");

    // dynamodb parameter
    const paramsGetIdFavorite = {
      TableName: userFavoritesModel.TableName,
      IndexName: "venueId-index",
      KeyConditionExpression: "venueId = :vi AND userId = :ui",
      ExpressionAttributeValues: {                
        ":vi": idVenue,
        ":ui": getUser?.Item.id
      },
      ProjectionExpression: "id, createdAt",
      limit: 1
    }
    
    const getIdFavorite = await ddb.query(paramsGetIdFavorite).promise();

    const getBlockedValue : { isBlocked: boolean } = req.body;
    const updateAt = new Date().toISOString();

    // dynamodb parameter
    const paramsDB : AWS.DynamoDB.DocumentClient.UpdateItemInput = {
      TableName: userFavoritesModel.TableName,
      Key: {
        id: getIdFavorite?.Items[0].id,
        userId: getUser?.Item.id
      },
      UpdateExpression: `
        set
          isBlocked = :ib,
          updatedAt = :ua
      `,
      ExpressionAttributeValues: {
        ':ib': getBlockedValue.isBlocked,
        ':ua': updateAt,
      },
      ReturnValues: 'UPDATED_NEW',
      ConditionExpression: 'attribute_exists(userId)'
    }
    
    // save data to database
    await ddb.update(paramsDB).promise();

    // return result
    return res.status(200).json({
      code: 200,
      message: 'success',
      data: {
        id: getIdFavorite?.Items[0].id,
        userId: getUser?.Item.id,
        venueId: idVenue,
        isBlocked: getBlockedValue.isBlocked,
        createdAt: getIdFavorite?.Items[0].createdAt,
        updatedAt: updateAt
      }
    });
  } catch (e) {
    // return default error
    next(e);
  }
};