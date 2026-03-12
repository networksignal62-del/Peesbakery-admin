// dotenv removed
const { createClient } = require('@supabase/supabase-js');
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://lvmpuuguuhfaoxmvgvwa.supabase.co";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx2bXB1dWd1dWhmYW94bXZndndhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzE2Mjg4NiwiZXhwIjoyMDg4NzM4ODg2fQ.3XqgkktBPafHhqF4z84lK-8RElqNgg0yjwzmmXlA5nQ";
const supabase = createClient(supabaseUrl, supabaseKey);

const categories = [
  { id: "african", name: "African Dishes", display_order: 1 },
  { id: "bakery", name: "Bakery & Cakes", display_order: 2 },
  { id: "fast-food", name: "Burgers & Shawarma", display_order: 3 },
  { id: "drinks", name: "Drinks & Desserts", display_order: 4 },
];

const products = [
  {
    name: "Spaghetti",
    category: "african",
    price: 180,
    image: "/spaghetti-chicken.jpg",
    description: "Delicious spaghetti with rich tomato sauce and herbs",
    long_description: "Our signature spaghetti is cooked to perfection with a rich tomato sauce, fresh herbs, and your choice of protein. A classic favorite that never disappoints.",
    featured: true,
    rating: 4.8,
    review_count: 124,
    addOns: [
      { name: "Extra Meat", price: 30 },
      { name: "Extra Cheese", price: 15 },
      { name: "Garlic Bread", price: 20 },
    ]
  },
  {
    name: "Whole Chicken",
    category: "african",
    price: 300,
    image: "/whole-chicken-new.jpg",
    description: "Perfectly roasted whole chicken with seasoning",
    long_description: "A full roasted chicken seasoned with our special blend of spices. Served with crispy fries. Perfect for sharing with family and friends.",
    featured: true,
    rating: 4.9,
    review_count: 198,
    addOns: [
      { name: "Extra Sauce", price: 10 },
      { name: "Fried Plantain", price: 15 },
      { name: "Coleslaw", price: 10 },
    ]
  },
  {
    name: "Half Chicken",
    category: "african",
    price: 250,
    image: "/images/half-20chinken.jpg",
    description: "Half roasted chicken with special seasoning",
    long_description: "Half of our perfectly roasted chicken, ideal for a single serving or smaller appetite. Seasoned to perfection.",
    featured: true,
    rating: 4.7,
    review_count: 156,
    addOns: [
      { name: "Extra Sauce", price: 10 },
      { name: "Fried Plantain", price: 15 },
      { name: "Rice", price: 20 },
    ]
  },
  {
    name: "Bulgur with Fish",
    category: "african",
    price: 250,
    image: "/images/bulgur.jpg",
    description: "Nutritious bulgur wheat served with fresh fish",
    long_description: "Healthy bulgur wheat cooked with vegetables and served with perfectly seasoned fish. A nutritious and delicious meal.",
    featured: true,
    rating: 4.6,
    review_count: 89,
    addOns: [
      { name: "Extra Fish", price: 40 },
      { name: "Extra Vegetables", price: 15 },
    ]
  },
  {
    name: "Fried Rice and Fish",
    category: "african",
    price: 250,
    image: "/images/fried-20rice-20and-20grilled-c2-a0fish.jpg",
    description: "Flavorful fried rice with seasoned grilled fish - Choose your size!",
    long_description: "Our special fried rice loaded with vegetables and served with perfectly grilled fish, fresh coleslaw, and fried plantains. A complete and satisfying meal. Available in Small (250 Le) and Large (350 Le) sizes!",
    rating: 4.8,
    review_count: 167,
    variants: [
      { name: "Small Size", price: 250, description: "Regular portion" },
      { name: "Large Size", price: 350, description: "Extra large portion" },
    ],
    addOns: [
      { name: "Extra Fish", price: 40 },
      { name: "Plantain", price: 15 },
    ]
  },
  {
    name: "Fried Rice and Chicken",
    category: "african",
    price: 250,
    image: "/images/fride-20rice-20and-20chicken.jpg",
    description: "Tasty fried rice with tender chicken - Choose your size!",
    long_description: "Delicious fried rice with mixed vegetables and tender chicken pieces. A popular choice for lunch or dinner. Available in Small (250 Le) and Large (350 Le) sizes!",
    rating: 4.7,
    review_count: 212,
    variants: [
      { name: "Small Size", price: 250, description: "Regular portion" },
      { name: "Large Size", price: 350, description: "Extra large portion" },
    ],
    addOns: [
      { name: "Extra Chicken", price: 30 },
      { name: "Coleslaw", price: 10 },
    ]
  },
  {
    name: "Shawarma Meat",
    category: "fast-food",
    price: 120,
    image: "/shawarma-meat.jpg",
    description: "Delicious meat shawarma wrap with fresh vegetables",
    long_description: "Tender marinated meat wrapped in fresh pita bread with lettuce, tomatoes, onions, and our special sauce.",
    featured: true,
    rating: 4.9,
    review_count: 245,
    addOns: [
      { name: "Extra Meat", price: 30 },
      { name: "Extra Sauce", price: 5 },
      { name: "Fries", price: 20 },
    ]
  },
  {
    name: "Shawarma Chicken",
    category: "fast-food",
    price: 100,
    image: "/shawarma-chicken.jpg",
    description: "Tasty chicken shawarma with fresh toppings",
    long_description: "Grilled chicken wrapped in soft pita with crisp vegetables and our signature garlic sauce. A customer favorite!",
    rating: 4.8,
    review_count: 278,
    addOns: [
      { name: "Extra Chicken", price: 25 },
      { name: "Extra Sauce", price: 5 },
      { name: "Fries", price: 20 },
    ]
  },
  {
    name: "Burger",
    category: "fast-food",
    price: 100,
    image: "/burger-new.png",
    description: "Classic beef burger with fresh toppings",
    long_description: "Juicy beef patty with lettuce, tomato, onions, pickles, and our special burger sauce on a toasted bun.",
    rating: 4.6,
    review_count: 201,
    addOns: [
      { name: "Extra Patty", price: 30 },
      { name: "Cheese", price: 10 },
      { name: "Bacon", price: 15 },
    ]
  },
  {
    name: "Egg Burger",
    category: "fast-food",
    price: 120,
    image: "/egg-burger-new.png",
    description: "Burger with fried egg and beef patty",
    long_description: "Our classic burger topped with a perfectly fried egg. The combination of runny yolk and juicy beef is irresistible!",
    rating: 4.7,
    review_count: 192,
    addOns: [
      { name: "Extra Egg", price: 15 },
      { name: "Cheese", price: 10 },
      { name: "Fries", price: 20 },
    ]
  },
  {
    name: "Double Burger",
    category: "fast-food",
    price: 170,
    image: "/double-burger-new.png",
    description: "Double beef patty burger for big appetites",
    long_description: "Two juicy beef patties stacked high with cheese, lettuce, tomato, and our special sauce. For those with a hearty appetite!",
    rating: 4.9,
    review_count: 234,
    addOns: [
      { name: "Extra Patty", price: 40 },
      { name: "Bacon", price: 15 },
      { name: "Fries", price: 20 },
    ]
  },
  {
    name: "Ice Cream Small",
    category: "drinks",
    price: 20,
    image: "/images/ice-20cream.jpg",
    description: "Small serving of creamy ice cream",
    long_description: "Cool and creamy ice cream in various flavors. Perfect for a sweet treat!",
    rating: 4.5,
    review_count: 167,
    addOns: [
      { name: "Extra Scoop", price: 10 },
      { name: "Toppings", price: 5 },
    ]
  },
  {
    name: "Ice Cream Large",
    category: "drinks",
    price: 50,
    image: "/images/ice-20cream-201.jpg",
    description: "Large serving of delicious ice cream",
    long_description: "Generous portion of our creamy ice cream. Available in multiple flavors to satisfy your sweet tooth.",
    rating: 4.6,
    review_count: 189,
    addOns: [
      { name: "Extra Scoop", price: 15 },
      { name: "Toppings", price: 8 },
    ]
  },
  {
    name: "Foofoo with Okra Soup",
    category: "african",
    price: 120,
    image: "/images/foofoo-20okara-20suap.jpg",
    description: "Traditional African foofoo with okra soup",
    long_description: "Smooth and stretchy foofoo served with rich okra soup and tender meat. A traditional African staple that's both filling and delicious.",
    rating: 4.7,
    review_count: 145,
    addOns: [
      { name: "Extra Foofoo", price: 30 },
      { name: "Extra Soup", price: 25 },
      { name: "Fish", price: 30 },
    ]
  },
  {
    name: "Birthday Cake Small",
    category: "bakery",
    price: 350,
    image: "/images/birthday-20cake-20350.jpg",
    description: "Small birthday cake for intimate celebrations",
    long_description: "Beautiful birthday cake perfect for small gatherings. Available in various flavors and can be customized with a message.",
    featured: true,
    addOns: [
      { name: "Custom Message", price: 10 },
      { name: "Candles", price: 5 },
    ]
  },
  {
    name: "Birthday Cake Medium",
    category: "bakery",
    price: 550,
    image: "/images/birthday-20cake-20550.jpg",
    description: "Medium birthday cake for family celebrations",
    long_description: "Perfect sized cake for family birthday celebrations. Choose from chocolate, vanilla, or red velvet flavors.",
    addOns: [
      { name: "Custom Message", price: 10 },
      { name: "Candles", price: 5 },
    ]
  },
  {
    name: "Customize Order",
    category: "bakery",
    price: 0,
    image: "/images/birthday-20cake-202500.jpg",
    description: "Custom birthday cake - message us for your design!",
    long_description: "Large celebration cake perfect for parties. Beautifully decorated with intricate designs. Multiple flavor options available.",
    addOns: [
      { name: "Custom Message", price: 15 },
      { name: "Candles", price: 8 },
    ]
  },
  {
    name: "Customized Cake Design",
    category: "bakery",
    price: 0,
    image: "/images/customize-20cake-203.jpg",
    description: "Create your dream cake with personalized designs and themes",
    long_description: "Bring your vision to life with our fully customized cake designs! From princess castles to superhero adventures... Contact us to discuss your design ideas.",
    is_customizable: true,
    featured: true,
  },
  {
    name: "Pizza",
    category: "fast-food",
    price: 250,
    image: "/pizza.jpg",
    description: "Delicious pepperoni pizza with melted cheese - Choose your size!",
    long_description: "Hot and fresh pizza loaded with pepperoni, mozzarella cheese, and our signature tomato sauce. Perfectly baked with a crispy crust. Available in Small, Medium, and Large sizes!",
    featured: true,
    rating: 4.9,
    review_count: 312,
    variants: [
      { name: "Small Pizza", price: 250, description: "Perfect for 1-2 people" },
      { name: "Medium Pizza", price: 350, description: "Great for 2-3 people" },
      { name: "Large Pizza", price: 500, description: "Feeds 3-4 people" },
    ],
    addOns: [
      { name: "Extra Cheese", price: 20 },
      { name: "Extra Pepperoni", price: 25 },
      { name: "Mushrooms", price: 15 },
    ]
  },
  {
    name: "Red Bull",
    category: "drinks",
    price: 60,
    image: "/redbull.jpeg",
    description: "Red Bull Energy Drink",
    long_description: "Ice cold Red Bull energy drink to keep you energized throughout the day.",
    rating: 4.6,
    review_count: 78,
  },
  {
    name: "Acheke and Chicken",
    category: "african",
    price: 200,
    image: "/acheke-african-dish.jpg",
    description: "Traditional Acheke with grilled chicken",
    long_description: "Authentic West African Acheke (attieke) - fermented cassava couscous served with tender grilled chicken.",
    featured: true,
    rating: 4.8,
    review_count: 156,
    addOns: [
      { name: "Extra Chicken", price: 50 },
      { name: "Extra Acheke", price: 30 },
      { name: "Extra Sauce", price: 10 },
    ]
  },
  {
    name: "Kebba",
    category: "african",
    price: 25,
    image: "/images/kebba.jpg",
    description: "Traditional African Kebba",
    long_description: "Delicious traditional African kebba, crispy on the outside and flavorful on the inside.",
    featured: true,
    addOns: [
      { name: "Extra Sauce", price: 5 },
      { name: "Extra Pieces", price: 30 },
    ]
  },
  {
    name: "Actater and Chicken",
    category: "african",
    price: 200,
    image: "/images/actater-chicken.jpg",
    description: "Actater served with delicious chicken",
    long_description: "Traditional Actater dish served with nicely seasoned chicken and special sauce.",
    addOns: [{ name: "Extra Chicken", price: 30 }]
  },
  {
    name: "Actater and Fish",
    category: "african",
    price: 300,
    image: "/images/actater-fish.jpg",
    description: "Actater served with grilled fish",
    long_description: "Traditional Actater dish served with tasty grilled fish and special sauce.",
    addOns: [{ name: "Extra Fish", price: 40 }]
  },
  {
    name: "Actater and Goat",
    category: "african",
    price: 400,
    image: "/images/actater-goat.jpg",
    description: "Actater served with tender goat meat",
    long_description: "Traditional Actater dish served with tender, flavorful goat meat and special sauce.",
    addOns: [{ name: "Extra Goat Meat", price: 50 }]
  }
];

async function seedData() {
  console.log("Starting DB seeding...");

  // Seed Categories
  for (const cat of categories) {
    const { error } = await supabase
      .from('categories')
      .upsert({ id: cat.id, name: cat.name, display_order: cat.display_order, is_active: true }, { onConflict: 'id' });
    if (error) console.error("Category Error", error);
  }
  
  // Seed Products
  for (const p of products) {
    // Check if exists
    const { data: existing } = await supabase.from('products').select('*').eq('name', p.name).single();
    if (existing) {
      console.log(`Product "${p.name}" already exists, skipping...`);
      continue;
    }

    const { addOns, variants, ...prodData } = p;
    prodData.is_active = true;
    prodData.is_customizable = prodData.is_customizable || false;
    prodData.featured = prodData.featured || false;

    const { data: insertedProd, error: prodErr } = await supabase
      .from('products')
      .insert(prodData)
      .select()
      .single();

    if (prodErr || !insertedProd) {
      console.error(`Failed to insert ${p.name}:`, prodErr);
      continue;
    }
    
    console.log(`Successfully added product: ${p.name}`);

    // Insert variants
    if (variants && variants.length > 0) {
      const vars = variants.map(v => ({ product_id: insertedProd.id, name: v.name, price: v.price, description: v.description }));
      await supabase.from('product_variants').insert(vars);
    }

    // Insert addons
    if (addOns && addOns.length > 0) {
      const adds = addOns.map(a => ({ product_id: insertedProd.id, name: a.name, price: a.price }));
      await supabase.from('product_addons').insert(adds);
    }
  }

  console.log("Seeding complete!");
}

seedData();
