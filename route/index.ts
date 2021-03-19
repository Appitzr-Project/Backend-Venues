import * as express from 'express';
import { Request, Response } from 'express';
import { favoritesSelect, favoritesGet, favoriteStoreValidate, favoriteDeleteValidate, favoriteStore, favoriteDelete, blockVenue } from '../controller/favoriteController';
import { cultureGet } from '../controller/cultureController';

import { venuesGet, venuesGetDetails } from '../controller/venueController';

// Route Declare
const route = express.Router();

// Route List
route.get('/', venuesGet); //fix use scan
route.get('/culture', cultureGet); //fix
route.get('/favorites', favoritesGet); //fix use scan
route.get('/:venueId', venuesGetDetails); //progress
route.post('/favorites', favoriteStoreValidate, favoriteStore); //fix

route.get('/favorites/:venueId', favoritesSelect); //progress
route.put('/favorites/:venueId', favoriteStoreValidate, favoriteStore); //progress
route.delete('/favorites/:venueId', favoriteStoreValidate, favoriteStore); //progress

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