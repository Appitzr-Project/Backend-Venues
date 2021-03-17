import * as express from 'express';
import { Request, Response } from 'express';
import { favoriteStoreValidate, favoriteDeleteValidate, favoriteStore, favoriteDelete } from '../controller/favoriteController';

// Route Declare
const route = express.Router();

// Route List
route.post('/favorite', favoriteStoreValidate, favoriteStore);
route.delete('/unfavorite', favoriteDeleteValidate, favoriteDelete);


// health check api
route.get('/health-check', (req: Request, res: Response) => {
    return res.status(200).json({
        code: 200,
        message: 'success',
        headers: req.headers
    });
})

// export all route
export default route;