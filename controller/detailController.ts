import { Response, NextFunction } from "express";
import { venueAttribute, venueProfileModel } from "@appitzr-project/db-model";
import { RequestAuthenticated } from "@base-pojokan/auth-aws-cognito";
import * as AWS from 'aws-sdk';

// declare database dynamodb
const ddb = new AWS.DynamoDB.DocumentClient({ endpoint: process.env.DYNAMODB_LOCAL, convertEmptyValues: true });

/**
 * Index Data Function
 *
 * @param req
 * @param res
 * @param next
 */
export const getVanueById = async (
  req: RequestAuthenticated,
  res: Response,
  next: NextFunction
) => {
  try {
    const {id} = req.params;
    
    const paramsDB: AWS.DynamoDB.DocumentClient.QueryInput = {
      TableName: venueProfileModel.TableName,
      KeyConditionExpression: "#id = :id",
      ExpressionAttributeNames: {
        "#id" : "cognitoId"
      },
      ExpressionAttributeValues: {
        ":id" : id
      },
      AttributesToGet: venueAttribute
    }

    const queryDB = await ddb.query(paramsDB).promise();
    const items = queryDB.Items;
    if(items[0]) {
      res.send({
        code: 200,
        message: "success",
        data: items[0]
      })
    } else {
      res.send({
        code: 404,
        message: "Not Found",
      })
    }

  } catch (e) {
    next(e);
  }
};
