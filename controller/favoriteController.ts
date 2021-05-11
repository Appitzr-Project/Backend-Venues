import { Response, NextFunction } from "express";
import { body, validationResult, ValidationChain } from 'express-validator';
import { userFavoritesModel, userFavorites, userProfileModel, venueProfileModel } from "@appitzr-project/db-model";
import { RequestAuthenticated, userDetail } from "@base-pojokan/auth-aws-cognito";
import * as AWS from 'aws-sdk';
import { v4 as uuidv4 } from 'uuid';

// declare database dynamodb
const ddb = new AWS.DynamoDB.DocumentClient({ endpoint: process.env.DYNAMODB_LOCAL, convertEmptyValues: true });

/**
 * Venue Profile Store Validation with Express Validator
 */
export const favoriteStoreValidate: ValidationChain[] = [
  body('venueId').notEmpty().isString(),
  body('isBlocked').notEmpty().isBoolean()
];

export const favoriteUpdateValidate: ValidationChain[] = [
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
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // dynamodb parameter
    const paramDB: AWS.DynamoDB.DocumentClient.GetItemInput = {
      TableName: userProfileModel.TableName,
      Key: {
        email: user.email,
        cognitoId: user.sub
      },
      AttributesToGet: ["id"]
    }

    // query to database
    const getUser = await ddb.get(paramDB).promise();
    const getQuery = req.params.isBlocked;

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
    /*
    * Return error kalau data di user profile tidak ada atau tidak ditemukan
    */
    if (e.message = 'Cannot read property \'id\ of undefined') {
      next(new Error('User profile data does not exist or not found.!'));
    }

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
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // dynamodb parameter
    const paramDB: AWS.DynamoDB.DocumentClient.GetItemInput = {
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
    const favorite: userFavorites = req.body;

    // venue Favorites input with typescript definition
    const userInput: userFavorites = {
      id: uuidv4(),
      userId: getUser?.Item.id,
      venueId: favorite.venueId,
      isBlocked: favorite.isBlocked,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    // dynamodb parameter
    const paramsDB: AWS.DynamoDB.DocumentClient.PutItemInput = {
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
    /*
    * Return error kalau data di user profile tidak ada atau tidak ditemukan
    */
    if (e.message = 'Cannot read property \'id\ of undefined') {
      next(new Error('User profile data does not exist or not found.!'));
    }

    // return default error
    next(e);
  }
};

export const getFavoriteById = async (
  req: RequestAuthenticated,
  res: Response,
  next: NextFunction
) => {
  try {
    // validate group
    const user = userDetail(req);

    // get param
    const venueIdFavorite = req.params.id;

    // favorites
    let venueFavorites: boolean = false;
    let venueBlocked: boolean = false;

    // exapress validate input
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // dynamodb parameter
    const paramDB: AWS.DynamoDB.DocumentClient.GetItemInput = {
      TableName: userProfileModel.TableName,
      Key: {
        email: user.email,
        cognitoId: user.sub
      },
      AttributesToGet: ["id"]
    }

    // query to database
    const getUser = await ddb.get(paramDB).promise();

    // get venue favorites
    const paramsVenuefavorites: AWS.DynamoDB.DocumentClient.QueryInput = {
      TableName: userFavoritesModel.TableName,
      IndexName: 'venueIdIndex',
      KeyConditionExpression: 'venueId = :vi AND userId = :ui',
      ExpressionAttributeValues: {
        ':vi': venueIdFavorite,
        ':ui': getUser?.Item.id
      },
      Limit: 1
    }
    const getFavorite = await ddb.query(paramsVenuefavorites).promise();

    // update venue favorites
    venueFavorites = getFavorite?.Items[0].isBlocked ? false : true;
    venueBlocked = getFavorite?.Items[0].isBlocked;

    // get venue detail
    const paramsVenueDetail: AWS.DynamoDB.DocumentClient.QueryInput = {
      TableName: venueProfileModel.TableName,
      IndexName: 'idIndex',
      KeyConditionExpression: 'id = :id',
      ExpressionAttributeValues: {
        ':id': venueIdFavorite,
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
      Limit: 1
    }
    const getVenueDetail = await ddb.query(paramsVenueDetail).promise();

    // set json result
    const result = { ...getVenueDetail?.Items[0], venueFavorites, venueBlocked }

    // return result
    return res.status(200).json({
      code: 200,
      message: 'success',
      data: result
    });

  } catch (e) {
    /*
    * Return error kalau data di user profile tidak ada atau tidak ditemukan
    */
    if (e.message = 'Cannot read property \'id\ of undefined') {
      next(new Error('User profile data does not exist or not found.!'));
    }

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

    // get param
    const venueIdFavorite = req.params.id;

    // exapress validate input
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // dynamodb parameter
    const paramDB: AWS.DynamoDB.DocumentClient.GetItemInput = {
      TableName: userProfileModel.TableName,
      Key: {
        email: user.email,
        cognitoId: user.sub
      },
      AttributesToGet: ['id']
    }

    // query to database
    const getUser = await ddb.get(paramDB).promise();

    const getBlockedValue: { isBlocked: boolean } = req.body;
    const updateAt = new Date().toISOString();

    // get favorites based on venueId
    const paramsVenuefavorites: AWS.DynamoDB.DocumentClient.QueryInput = {
      TableName: userFavoritesModel.TableName,
      IndexName: 'venueIdIndex',
      KeyConditionExpression: 'venueId = :vi AND userId = :ui',
      ExpressionAttributeValues: {
        ':vi': venueIdFavorite,
        ':ui': getUser?.Item.id
      },
      Limit: 1
    }
    const getFavorite = await ddb.query(paramsVenuefavorites).promise();

    // dynamodb parameter
    const paramsDB: AWS.DynamoDB.DocumentClient.UpdateItemInput = {
      TableName: userFavoritesModel.TableName,
      Key: {
        id: getFavorite?.Items[0]?.id,
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
      ReturnValues: 'ALL_NEW',
      ConditionExpression: 'attribute_exists(userId)'
    }

    // save data to database
    const dataUpdate = await ddb.update(paramsDB).promise();

    // return result
    return res.status(200).json({
      code: 200,
      message: 'success',
      data: dataUpdate?.Attributes
    });
  } catch (e) {
    /*
    * Return error kalau data di user profile tidak ada atau tidak ditemukan
    */
    if (e.message = 'Cannot read property \'id\ of undefined') {
      next(new Error('User profile data does not exist or not found.!'));
    }

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

    // get param
    const venueIdFavorite = req.params.id;

    // exapress validate input
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // dynamodb parameter
    const paramDB: AWS.DynamoDB.DocumentClient.GetItemInput = {
      TableName: userProfileModel.TableName,
      Key: {
        email: user.email,
        cognitoId: user.sub
      },
      AttributesToGet: ['id']
    }

    // query to database
    const getUser = await ddb.get(paramDB).promise();

    // get favorites based on venueId
    const paramsVenuefavorites: AWS.DynamoDB.DocumentClient.QueryInput = {
      TableName: userFavoritesModel.TableName,
      IndexName: 'venueIdIndex',
      KeyConditionExpression: 'venueId = :vi AND userId = :ui',
      ExpressionAttributeValues: {
        ':vi': venueIdFavorite,
        ':ui': getUser?.Item.id
      },
      Limit: 1
    }
    const getFavorite = await ddb.query(paramsVenuefavorites).promise();

    const paramDel = {
      TableName: userFavoritesModel.TableName,
      Key: {
        id: getFavorite?.Items[0]?.id,
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
    /*
    * Return error kalau data di user profile tidak ada atau tidak ditemukan
    */
    if (e.message = 'Cannot read property \'id\ of undefined') {
      next(new Error('User profile data does not exist or not found.!'));
    }

    // return default error
    next(e);
  }
};