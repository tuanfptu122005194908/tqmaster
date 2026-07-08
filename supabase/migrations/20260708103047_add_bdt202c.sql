-- Add hardcoded BDT202c subject to support orders and checkouts
INSERT INTO public.subjects (
    id, 
    name, 
    description, 
    price, 
    semester, 
    is_active, 
    sort_order
)
VALUES (
    '9d863b0b-22fa-4cb5-b467-15103a8904e5',
    'BDT202c',
    'Khóa học Google Cloud Study Hub (BDT202c)',
    50000, -- Default price, user can change in dashboard if needed
    4,
    true,
    999 -- Place it at the end
)
ON CONFLICT (id) DO NOTHING;
