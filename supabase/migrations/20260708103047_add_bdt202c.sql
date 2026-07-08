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
    'hardcoded-bdt202c',
    'BDT202c',
    'Khóa học Google Cloud Study Hub (BDT202c)',
    50000, -- Default price, user can change in dashboard if needed
    4,
    true,
    999 -- Place it at the end
)
ON CONFLICT (id) DO NOTHING;
