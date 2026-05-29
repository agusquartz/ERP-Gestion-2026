--================================
--         Accounting
--================================
--================================
--           Salary
--================================

-- EMPLOYEES (no foreign keys)
INSERT INTO employees
(document, name, surname, birth_date, hire_date, termination_date, job_title, is_active)
VALUES
('10000001', 'Ana',    'Lopez',      '1990-03-12', '2023-01-10', NULL, 'Purchasing Specialist',      TRUE),
('10000002', 'Bruno',  'Martinez',   '1988-07-22', '2023-02-15', NULL, 'Sales Executive',            TRUE),
('10000003', 'Carla',  'Benitez',    '1992-11-05', '2023-03-01', NULL, 'Treasury Analyst',           TRUE),
('10000004', 'Diego',  'Fernandez',  '1987-09-18', '2023-04-12', NULL, 'Payroll Analyst',            TRUE),
('10000005', 'Elena',  'Ruiz',       '1991-01-30', '2023-05-08', NULL, 'Senior Accountant',          TRUE),
('10000006', 'Fabian', 'Gomez',      '1989-06-14', '2023-05-22', NULL, 'Purchasing Assistant',       TRUE),
('10000007', 'Gabriela','Ortega',    '1993-04-09', '2023-06-01', NULL, 'Sales Assistant',            TRUE),
('10000008', 'Hector', 'Vargas',     '1986-12-03', '2023-06-19', NULL, 'Cashier',                    TRUE),
('10000009', 'Irene',  'Sosa',       '1994-08-27', '2023-07-03', NULL, 'HR Assistant',               TRUE),
('10000010', 'Javier', 'Mendoza',    '1985-10-11', '2023-07-17', NULL, 'Accounting Assistant',       TRUE),
('10000011', 'Karen',  'Aguirre',    '1990-02-25', '2023-08-02', NULL, 'Supplier Coordinator',       TRUE),
('10000012', 'Luis',   'Paredes',    '1984-05-16', '2023-08-14', NULL, 'Sales Coordinator',          TRUE),
('10000013', 'Marta',  'Cabrera',    '1995-09-21', '2023-09-05', NULL, 'Bank Reconciliation Clerk',  TRUE),
('10000014', 'Nicolas','Dominguez',  '1988-01-07', '2023-09-18', NULL, 'Payroll Clerk',              TRUE),
('10000015', 'Olivia', 'Acosta',     '1992-05-29', '2023-10-02', NULL, 'General Ledger Clerk',       TRUE),
('10000016', 'Pablo',  'Rojas',      '1987-03-15', '2023-10-16', NULL, 'Purchasing Clerk',           TRUE),
('10000017', 'Quinta', 'Flores',     '1991-12-08', '2023-11-01', NULL, 'Sales Representative',       TRUE),
('10000018', 'Raul',   'Silva',      '1989-04-19', '2023-11-13', NULL, 'Treasury Clerk',             TRUE),
('10000019', 'Sofia',  'Castillo',   '1993-07-31', '2023-12-04', NULL, 'HR Generalist',              TRUE),
('10000020', 'Tomas',  'Vera',       '1986-11-26', '2023-12-18', NULL, 'Accountant',                 TRUE);

--================================
--            users
--================================

-- PERMISSIONS (no foreign keys)


--================================
--            Sales
--================================
--================================
--           Purchases
--================================

INSERT INTO emission_points (
    establishment,
    emission_point,
    current_sequential,
    max_sequential,
    is_active
)
VALUES (
    1,
    1,
    0,
    9999999,
    TRUE
);

CREATE TABLE emission_points (
    id SERIAL PRIMARY KEY,
    establishment INT NOT NULL,
    emission_point INT NOT NULL,
    current_sequential INT NOT NULL DEFAULT 0,
    max_sequential INT NOT NULL DEFAULT 9999999, -- El límite
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    UNIQUE(establishment, emission_point)
);





-- =========================================================
-- DATOS SEMILLA MÁS "REALES"
-- PostgreSQL
-- =========================================================

-- =========================================================
-- TAXES
-- =========================================================

INSERT INTO taxes (name, percentage) VALUES
('IVA 10%', 10.00),
('IVA 5%', 5.00),
('ISC', 12.00);

-- =========================================================
-- CATEGORIES
-- =========================================================

INSERT INTO categories (name)
SELECT unnest(ARRAY[
    'Aceites de Motor',
    'Aceites de Transmisión',
    'Filtros de Aceite',
    'Filtros de Aire',
    'Filtros de Combustible',
    'Baterías',
    'Pastillas de Freno',
    'Discos de Freno',
    'Amortiguadores',
    'Radiadores',
    'Refrigerantes',
    'Bujías',
    'Correas',
    'Bombas de Agua',
    'Limpiaparabrisas',
    'Luces LED',
    'Sensores',
    'Neumáticos',
    'Aditivos',
    'Accesorios'
]);

-- =========================================================
-- 100 MARCAS
-- =========================================================

INSERT INTO brands (name)
SELECT unnest(ARRAY[
    'AutoMax','PowerDrive','LubriTech','RoadStar','UltraOil',
    'NitroX','PrimeAuto','GearForce','MotorLine','TurboMax',
    'Apex Parts','Velocity','Dynatek','BlueMotion','RedLine',
    'SilverOil','BlackHorse','ProLube','MaxTorque','EcoDrive',
    'IronGear','RapidFlow','DriveTech','MotoPlus','SpeedLine',
    'MasterOil','NovaParts','TitanForce','Quantum','Polar',
    'HelixPro','SparkTech','BrakeOne','CoolFlow','TopGear',
    'AutoPrime','Infinity Parts','AutoNova','ElectroCar','MegaDrive',
    'FastTrack','GrandPrix','UrbanMotion','RacerX','Motron',
    'AutoLux','MotoElite','FusionParts','Vortex','NeoDrive',
    'HyperLube','GT Performance','TurboLine','SmartParts','DriveMax',
    'PeakAuto','RoadTech','EverMotion','StrongBrake','NitroParts',
    'ExtremeOil','TrueDrive','Vertex','EcoMotion','MaxSpeed',
    'AlphaParts','BetaOil','GammaDrive','DeltaForce','OmegaParts',
    'CoreAuto','MotionPro','DrivePro','FlexMotor','RoyalParts',
    'DynamicOil','GreenMotion','BlueDrive','FastOil','ProBrake',
    'TopMotion','XDrive','ZoomAuto','FireRoad','SteelForce',
    'RoadMaster','NextGear','AutoCore','PowerMotion','MotoDrive',
    'UltraParts','HyperDrive','NorthRoad','SouthMotor','EastGear',
    'WestDrive','PrecisionAuto','VelocityX','AutoWorld','PrimeMotion'
]);

-- =========================================================
-- 2000 PRODUCTOS MÁS REALES
-- =========================================================

WITH product_base AS (

    SELECT
        gs,

        -- categoría aleatoria
        (
            SELECT c.id
            FROM categories c
            ORDER BY random()
            LIMIT 1
        ) AS category_id,

        -- marca aleatoria
        (
            SELECT b.id
            FROM brands b
            ORDER BY random()
            LIMIT 1
        ) AS brand_id

    FROM generate_series(1, 2000) gs
)

INSERT INTO products (
    code,
    cost,
    price,
    stock,
    category_id,
    brand_id,
    is_active,
    description,
    last_acquisition_cost
)

SELECT
    -- código
    'SKU-' || LPAD(gs::text, 6, '0'),

    -- costo
    ROUND(
        (
            CASE
                WHEN c.name ILIKE '%Aceites%' THEN 15 + random() * 120
                WHEN c.name ILIKE '%Baterías%' THEN 45 + random() * 300
                WHEN c.name ILIKE '%Neumáticos%' THEN 40 + random() * 450
                WHEN c.name ILIKE '%Discos%' THEN 30 + random() * 180
                ELSE 8 + random() * 150
            END
        )::numeric,
        2
    ) AS cost,

    -- precio
    ROUND(
        (
            CASE
                WHEN c.name ILIKE '%Aceites%' THEN 25 + random() * 180
                WHEN c.name ILIKE '%Baterías%' THEN 70 + random() * 450
                WHEN c.name ILIKE '%Neumáticos%' THEN 65 + random() * 700
                WHEN c.name ILIKE '%Discos%' THEN 55 + random() * 260
                ELSE 15 + random() * 240
END
        )::numeric,
        2
    ) AS price,

    -- stock
    FLOOR(random() * 200)::int,

    category_id,

    brand_id,

    -- activos
    (random() < 0.97),

    -- descripción más realista
    CASE

        WHEN c.name = 'Aceites de Motor' THEN
            'Aceite sintético ' ||
            (ARRAY['5W30','10W40','15W40','20W50'])[floor(random()*4+1)] ||
            ' ' ||
            (ARRAY['1L','4L','5L'])[floor(random()*3+1)]

        WHEN c.name = 'Aceites de Transmisión' THEN
            'Aceite transmisión ATF ' ||
            (ARRAY['Dexron II','Dexron III','CVT','GL-5'])[floor(random()*4+1)]

        WHEN c.name = 'Filtros de Aceite' THEN
            'Filtro de aceite modelo FO-' ||
            FLOOR(random()*9000 + 1000)

        WHEN c.name = 'Filtros de Aire' THEN
            'Filtro de aire alto flujo AF-' ||
            FLOOR(random()*9000 + 1000)

        WHEN c.name = 'Filtros de Combustible' THEN
            'Filtro de combustible FC-' ||
            FLOOR(random()*9000 + 1000)

        WHEN c.name = 'Baterías' THEN
            'Batería ' ||
            (ARRAY['45Ah','60Ah','75Ah','90Ah'])[floor(random()*4+1)] ||
            ' ' ||
            (ARRAY['12V','24V'])[floor(random()*2+1)]

        WHEN c.name = 'Pastillas de Freno' THEN
            'Juego de pastillas cerámicas BF-' ||
            FLOOR(random()*5000 + 1000)

        WHEN c.name = 'Discos de Freno' THEN
            'Disco ventilado DF-' ||
            FLOOR(random()*5000 + 1000)

        WHEN c.name = 'Amortiguadores' THEN
            'Amortiguador hidráulico AM-' ||
            FLOOR(random()*5000 + 1000)

        WHEN c.name = 'Radiadores' THEN
            'Radiador aluminio RD-' ||
            FLOOR(random()*5000 + 1000)

        WHEN c.name = 'Refrigerantes' THEN
            'Refrigerante ' ||
            (ARRAY['Rojo','Verde','Azul'])[floor(random()*3+1)] ||
            ' ' ||
            (ARRAY['1L','4L'])[floor(random()*2+1)]

        WHEN c.name = 'Bujías' THEN
            'Bujía iridium BG-' ||
            FLOOR(random()*5000 + 1000)

        WHEN c.name = 'Correas' THEN
            'Correa dentada CR-' ||
            FLOOR(random()*5000 + 1000)

        WHEN c.name = 'Bombas de Agua' THEN
            'Bomba de agua BA-' ||
            FLOOR(random()*5000 + 1000)

        WHEN c.name = 'Limpiaparabrisas' THEN
            'Limpiaparabrisas ' ||
            (ARRAY['14','16','18','20','22','24'])[floor(random()*6+1)] ||
            ' pulgadas'

        WHEN c.name = 'Luces LED' THEN
            'Kit LED ' ||
            (ARRAY['H1','H4','H7','9005','9006'])[floor(random()*5+1)]

        WHEN c.name = 'Sensores' THEN
            'Sensor automotriz SN-' ||
            FLOOR(random()*5000 + 1000)

        WHEN c.name = 'Neumáticos' THEN
            'Neumático ' ||
            (ARRAY['175/70R13','185/65R14','195/65R15','205/55R16'])[floor(random()*4+1)]

        WHEN c.name = 'Aditivos' THEN
            'Aditivo limpiador ' ||
            (ARRAY['inyectores','motor','radiador','combustible'])[floor(random()*4+1)]

        ELSE
            'Accesorio automotriz AX-' ||
            FLOOR(random()*5000 + 1000)

    END,

    -- último costo adquisición
    ROUND(
        (
            CASE
                WHEN c.name ILIKE '%Aceites%' THEN 15 + random() * 120
                WHEN c.name ILIKE '%Baterías%' THEN 45 + random() * 300
                WHEN c.name ILIKE '%Neumáticos%' THEN 40 + random() * 450
                ELSE 8 + random() * 150
            END
        )::numeric,
        2
    )

FROM product_base pb
JOIN categories c ON c.id = pb.category_id;

-- =========================================================
-- IMPUESTOS POR PRODUCTO
-- =========================================================

INSERT INTO product_taxes (product_id, tax_id)
SELECT
    p.id,
    CASE
        WHEN random() < 0.80 THEN 1
        WHEN random() < 0.95 THEN 2
        ELSE 3
    END
FROM products p
ON CONFLICT DO NOTHING;