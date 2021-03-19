import { Response, NextFunction } from "express";
import { cultureCategory } from "@appitzr-project/db-model";
import { RequestAuthenticated } from "@base-pojokan/auth-aws-cognito";

export const cultureGet = async (
    req: RequestAuthenticated,
    res: Response,
    next: NextFunction
  ) => {
    try {
      // return result
      return res.status(200).json({
        code: 200,
        message: 'success',
        data: cultureCategory
      });
  
    } catch (e) {
      // return default error
      next(e);
    }
  };