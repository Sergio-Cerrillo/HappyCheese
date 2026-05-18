-- Insert default stores
INSERT INTO happycheese.stores (id, name, address, phone, hours, coordinates, active, "createdAt", "updatedAt")
VALUES 
  (
    'happycheese',
    'HappyCheese',
    'Carrer de Sant Magí, 45, 07013 Palma',
    '+34 871 234 567',
    'Lun-Sáb: 10:00 - 20:00 | Dom: 11:00 - 15:00',
    '{"lat": 39.5696, "lng": 2.6322}',
    true,
    NOW(),
    NOW()
  ),
  (
    'happycheese-lux',
    'HappyCheese LUX',
    'Carrer de la Unió, 12, 07001 Palma',
    '+34 871 234 568',
    'Lun-Sáb: 09:30 - 20:30 | Dom: 10:00 - 14:00',
    '{"lat": 39.5708, "lng": 2.6502}',
    true,
    NOW(),
    NOW()
  )
ON CONFLICT (id) DO NOTHING;

-- Insert default flavors
INSERT INTO happycheese.flavors (id, name, description, prices, image, active, availability, "createdAt", "updatedAt")
VALUES
  (
    '1',
    'Clásica Original',
    'Nuestra receta original con queso crema de primera calidad, base de galleta artesanal y un toque de vainilla de Madagascar.',
    '{"individual": 6.90, "doble": 12.90, "mediana": 24.90, "grande": 42.90}',
    '/images/clasica.jpg',
    true,
    '[{"storeId": "happycheese", "portions": ["individual", "doble", "mediana", "grande"]}, {"storeId": "happycheese-lux", "portions": ["individual", "doble", "mediana", "grande"]}]',
    NOW(),
    NOW()
  ),
  (
    '2',
    'Frutos Rojos',
    'Tarta de queso coronada con una deliciosa mezcla de fresas, frambuesas y arándanos frescos de temporada.',
    '{"individual": 7.90, "doble": 14.90, "mediana": 27.90, "grande": 47.90}',
    '/images/frutos-rojos.jpg',
    true,
    '[{"storeId": "happycheese", "portions": ["individual", "doble", "mediana", "grande"]}, {"storeId": "happycheese-lux", "portions": ["individual", "mediana", "grande"]}]',
    NOW(),
    NOW()
  ),
  (
    '3',
    'Caramelo Salado',
    'Combinación perfecta de dulce y salado con caramelo artesanal y escamas de sal Maldon.',
    '{"individual": 7.90, "doble": 14.90, "mediana": 28.90, "grande": 49.90}',
    '/images/caramelo.jpg',
    true,
    '[{"storeId": "happycheese", "portions": ["individual", "doble", "mediana", "grande"]}]',
    NOW(),
    NOW()
  ),
  (
    '4',
    'Chocolate Belga',
    'Para los amantes del chocolate: con ganache de chocolate belga 70% cacao y virutas de chocolate negro.',
    '{"individual": 8.90, "doble": 15.90, "mediana": 29.90, "grande": 51.90}',
    '/images/chocolate.jpg',
    true,
    '[{"storeId": "happycheese", "portions": ["individual", "doble", "mediana", "grande"]}, {"storeId": "happycheese-lux", "portions": ["individual", "doble", "mediana", "grande"]}]',
    NOW(),
    NOW()
  ),
  (
    '5',
    'Limón Mediterráneo',
    'Refrescante tarta con crema de limón de Sóller y merengue italiano ligeramente tostado.',
    '{"individual": 7.50, "doble": 13.90, "mediana": 26.90, "grande": 45.90}',
    '/images/limon.jpg',
    true,
    '[{"storeId": "happycheese-lux", "portions": ["individual", "doble", "mediana", "grande"]}]',
    NOW(),
    NOW()
  ),
  (
    '6',
    'Pistacho',
    'Elaborada con pistacho siciliano de Bronte, cremosa y con un sabor único e inolvidable.',
    '{"individual": 9.90, "doble": 17.90, "mediana": 31.90, "grande": 55.90}',
    '/images/pistacho.jpg',
    true,
    '[{"storeId": "happycheese", "portions": ["individual", "doble", "mediana", "grande"]}, {"storeId": "happycheese-lux", "portions": ["individual", "mediana", "grande"]}]',
    NOW(),
    NOW()
  ),
  (
    '7',
    'Lotus Biscoff',
    'Con la inconfundible galleta Lotus caramelizada, crema de speculoos y topping crujiente.',
    '{"individual": 8.50, "doble": 15.90, "mediana": 28.90, "grande": 49.90}',
    '/images/lotus.jpg',
    true,
    '[{"storeId": "happycheese", "portions": ["individual", "doble", "mediana", "grande"]}, {"storeId": "happycheese-lux", "portions": ["individual", "doble", "mediana", "grande"]}]',
    NOW(),
    NOW()
  ),
  (
    '8',
    'Matcha',
    'Exótica fusión de queso cremoso con té matcha japonés ceremonial de Uji.',
    '{"individual": 9.50, "doble": 17.50, "mediana": 30.90, "grande": 53.90}',
    '/images/matcha.jpg',
    true,
    '[{"storeId": "happycheese-lux", "portions": ["individual", "doble", "mediana"]}]',
    NOW(),
    NOW()
  )
ON CONFLICT (id) DO NOTHING;

-- Insert default admin (password: admin123 - cambiar en producción)
INSERT INTO happycheese.admins (id, username, "passwordHash", "createdAt")
VALUES 
  (
    'admin-1',
    'admin',
    'admin123',
    NOW()
  )
ON CONFLICT (username) DO NOTHING;
