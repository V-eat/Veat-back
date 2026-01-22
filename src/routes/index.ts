import { Router } from 'express';
import { UserController } from '../controllers/userController';
import { RestaurantController } from '../controllers/restaurantController';
import { RestaurantHourController } from '../controllers/restaurantHourController';
import { DishController } from '../controllers/dishController';
import { OrderController } from '../controllers/orderController';
import { OrderItemController } from '../controllers/orderItemController';
import { OrderUserController } from '../controllers/orderUserController';
import { RatingController } from '../controllers/ratingController';
import { FavoriteController } from '../controllers/favoriteController';

const router = Router();

const userController = new UserController();
const restaurantController = new RestaurantController();
const restaurantHourController = new RestaurantHourController();
const dishController = new DishController();
const orderController = new OrderController();
const orderItemController = new OrderItemController();
const orderUserController = new OrderUserController();
const ratingController = new RatingController();
const favoriteController = new FavoriteController();

// User routes
router.get('/users', userController.getAllUsers);
router.get('/users/:id', userController.getUser);
router.post('/users', userController.createUser);
router.put('/users/:id', userController.updateUser);
router.delete('/users/:id', userController.deleteUser);

// Restaurant routes
router.get('/restaurants', restaurantController.getAllRestaurants);
router.get('/restaurants/:id', restaurantController.getRestaurant);
router.post('/restaurants', restaurantController.createRestaurant);
router.put('/restaurants/:id', restaurantController.updateRestaurant);
router.delete('/restaurants/:id', restaurantController.deleteRestaurant);

// Restaurant hours routes
router.get('/restaurant-hours/:restaurantId', restaurantHourController.getRestaurantHours);
router.post('/restaurant-hours', restaurantHourController.createRestaurantHour);
router.put('/restaurant-hours/:restaurantId', restaurantHourController.updateRestaurantHour);
router.delete('/restaurant-hours/:restaurantId', restaurantHourController.deleteRestaurantHour);

// Dish routes
router.get('/dishes', dishController.getAllDishes);
router.get('/dishes/:id', dishController.getDish);
router.post('/dishes', dishController.createDish);
router.put('/dishes/:id', dishController.updateDish);
router.delete('/dishes/:id', dishController.deleteDish);

// Order routes
router.get('/orders', orderController.getAllOrders);
router.get('/orders/:id', orderController.getOrder);
router.post('/orders', orderController.createOrder);
router.put('/orders/:id', orderController.updateOrder);
router.delete('/orders/:id', orderController.deleteOrder);

// Order item routes
router.get('/order-items', orderItemController.getAllOrderItems);
router.get('/order-items/:id', orderItemController.getOrderItem);
router.post('/order-items', orderItemController.createOrderItem);
router.put('/order-items/:id', orderItemController.updateOrderItem);
router.delete('/order-items/:id', orderItemController.deleteOrderItem);

// Order user routes
router.get('/order-users/:orderId/:userId', orderUserController.getOrderUser);
router.get('/order-users/:orderId', orderUserController.getOrderUsers);
router.post('/order-users', orderUserController.createOrderUser);
router.put('/order-users/:orderId/:userId', orderUserController.updateOrderUser);
router.delete('/order-users/:orderId/:userId', orderUserController.deleteOrderUser);

// Rating routes
router.get('/ratings/:userId/:restaurantId', ratingController.getRating);
router.get('/ratings/:restaurantId', ratingController.getRestaurantRatings);
router.post('/ratings', ratingController.createRating);
router.put('/ratings/:userId/:restaurantId', ratingController.updateRating);
router.delete('/ratings/:userId/:restaurantId', ratingController.deleteRating);

// Favorite routes
router.get('/favorites/:userId/:restaurantId', favoriteController.getFavorite);
router.get('/favorites/:userId', favoriteController.getUserFavorites);
router.post('/favorites', favoriteController.createFavorite);
router.delete('/favorites/:userId/:restaurantId', favoriteController.deleteFavorite);

export default router;
