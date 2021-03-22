import * as express from 'express';
import { Request, Response } from 'express';
import { favoriteUpdate, getFavoriteById, favoritesGet, favoriteStoreValidate, favoriteUpdateValidate, favoriteStore, favoriteDelete } from '../controller/favoriteController';
import { cultureGet } from '../controller/cultureController';

import { venuesGet, venuesGetDetails } from '../controller/venueController';

// Route Declare
const route = express.Router();

// Route List
route.get('/', venuesGet);
route.get('/culture', cultureGet);
route.get('/favorites', favoritesGet);
route.get('/:venueId', venuesGetDetails);
route.post('/favorites', favoriteStoreValidate, favoriteStore);
route.get('/favorites/:id', getFavoriteById);
route.put('/favorites/:id', favoriteUpdateValidate, favoriteUpdate);
route.delete('/favorites/:id', favoriteDelete);

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