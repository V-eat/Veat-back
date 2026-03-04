CREATE TABLE users (
    user_id uuid PRIMARY KEY,
    last_name VARCHAR(100) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    birthdate TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    email_notifications BOOLEAN DEFAULT TRUE,
    sms_notifications BOOLEAN DEFAULT FALSE,
    fidelity_points INT DEFAULT 0,
    is_owner BOOLEAN DEFAULT FALSE,
    is_admin BOOLEAN DEFAULT FALSE
);

CREATE TABLE restaurants (
    restaurant_id SERIAL PRIMARY KEY,
    owner_id uuid NOT NULL,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20),
    description TEXT,
    adresse VARCHAR(255),
    latitude DECIMAL(9,6),
    longitude DECIMAL(9,6),
    rating_average DECIMAL(2,1),
    cuisine_type VARCHAR(100),
    is_open BOOLEAN DEFAULT FALSE,
    preparation_time INT,
    commission_rate DECIMAL(5,2),
    stripe_account_id VARCHAR(255),
    is_onboarded BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE restaurant_photo (
    restaurant_id INT NOT NULL,
    photo_url VARCHAR(255) NOT NULL,
    PRIMARY KEY (restaurant_id, photo_url),
    FOREIGN KEY (restaurant_id) REFERENCES restaurants(restaurant_id) ON DELETE CASCADE
);

CREATE TABLE restaurant_hours (
    restaurant_id INT NOT NULL,
    day_of_week INT CHECK (day_of_week BETWEEN 1 AND 7),
    open_time TIME,
    close_time TIME,
    PRIMARY KEY (restaurant_id, day_of_week),
    FOREIGN KEY (restaurant_id) REFERENCES restaurants(restaurant_id) ON DELETE CASCADE
);

CREATE TABLE dishes (
    dish_id SERIAL PRIMARY KEY,
    restaurant_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    allergens VARCHAR(255),
    price DECIMAL(10,2) NOT NULL,
    photo_url VARCHAR(255),
    is_available BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (restaurant_id) REFERENCES restaurants(restaurant_id) ON DELETE CASCADE
);

CREATE TABLE orders (
    order_id SERIAL PRIMARY KEY,
    restaurant_id INT NOT NULL,
    order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    total_amount DECIMAL(10,2),
    solo_payment BOOLEAN DEFAULT TRUE,
    guests_number INT,
    status VARCHAR(50),
    FOREIGN KEY (restaurant_id) REFERENCES restaurants(restaurant_id)
);

CREATE TABLE order_items (
    order_item_id SERIAL PRIMARY KEY,
    order_id INT NOT NULL,
    dish_id INT NOT NULL,
    quantity INT NOT NULL CHECK (quantity > 0),
    price DECIMAL(10,2) NOT NULL,
    user_id uuid NOT NULL,
    person_number INT NOT NULL,
    FOREIGN KEY (order_id) REFERENCES orders(order_id) ON DELETE CASCADE,
    FOREIGN KEY (dish_id) REFERENCES dishes(dish_id)
);

CREATE TABLE order_users (
    order_id INT NOT NULL,
    user_id uuid NOT NULL,
    is_owner BOOLEAN DEFAULT FALSE,
    is_paid BOOLEAN DEFAULT FALSE,
    amount DECIMAL(10,2),
    PRIMARY KEY (order_id, user_id),
    FOREIGN KEY (order_id) REFERENCES orders(order_id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

CREATE TABLE rating (
    user_id uuid NOT NULL,
    restaurant_id INT NOT NULL,
    rating INT CHECK (rating BETWEEN 1 AND 5),
    commentary VARCHAR(255),
    PRIMARY KEY (user_id, restaurant_id),
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (restaurant_id) REFERENCES restaurants(restaurant_id) ON DELETE CASCADE
);

CREATE TABLE favorite (
    user_id uuid NOT NULL,
    restaurant_id INT NOT NULL,
    PRIMARY KEY (user_id, restaurant_id),
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (restaurant_id) REFERENCES restaurants(restaurant_id) ON DELETE CASCADE
);