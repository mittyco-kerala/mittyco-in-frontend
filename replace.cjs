const fs = require('fs');

const path = 'src/features/single product/page/Single_product.jsx';
let data = fs.readFileSync(path, 'utf8');

const startStr = '<div className="single-product">';
const endStr = '</div>\r\n\r\n        </div>\r\n\r\n    );\r\n\r\n}';

const start = data.indexOf(startStr);
const endStrFallback1 = '</div>\n\n        </div>\n\n    );\n\n}';
const endStrFallback2 = '</div>\n\n    );\n\n}';

let end = data.indexOf(endStr);
if(end === -1) end = data.indexOf(endStrFallback1);
if(end === -1) end = data.indexOf(endStrFallback2);
if (end === -1) end = data.lastIndexOf('</div>'); // last resort, but risky if there are multiple, wait

// Instead of matching the end exactly, we can use lastIndexOf('</div>\n\n    );\n\n}')
if(end === -1) {
   let lines = data.split('\n');
   let found = false;
   for(let i = lines.length - 1; i >= 0; i--) {
       if(lines[i].includes(');')) {
           end = data.lastIndexOf('<div className="single-product">'); // Need to find the end properly
           break;
       }
   }
}

// Easier way is just to substring from the start and find the matching closing div of "single-product-main"
// Actually we can just do a regex replace or just slice based on knowing the return statement starts around line 433.
// The return statement is:
// return (
//     <div className="single-product-main"> ... <div className="single-product"> ... </div> </div>
// );

const regex = /<div className="single-product">[\s\S]*?(?=<\/div>\s*<\/div>\s*\)\s*;\s*})/;

const newContent = `
            <div className="single-product">
                {/* LEFT: IMAGE GALLERY */}
                <div className="gallery-section">
                    <div className="main-image">
                        <img
                            src={
                                activeImage
                                    ? getImageUrl(activeImage)
                                    : getImageUrl(selectedVariant?.images?.find(
                                        img => img.is_primary
                                    )?.image)
                            }
                            alt={data.name}
                        />
                    </div>
                    <div className="thumbs">
                        {displayImages.map((img) => (
                            <img
                                key={img.id}
                                src={getImageUrl(img.image)}
                                alt={data.name}
                                className={
                                    activeImage === img.image
                                        ? "active-thumb"
                                        : ""
                                }
                                onClick={() => setActiveImage(img.image)}
                            />
                        ))}
                    </div>
                </div>

                {/* CENTER: PRODUCT INFORMATION */}
                <div className="info-section">
                    <h1>{data.name}</h1>
                    {/* Add brand or category if available */}

                    <p className="description">{data.description}</p>

                    <div className="option-block">
                        <h4>Color</h4>
                        <div className="colors">
                            {colors.map((color) => (
                                <button
                                    key={color.id}
                                    className={selectedColor?.id === color.id ? "color active-color" : "color"}
                                    style={{ background: color.code }}
                                    title={color.name}
                                    onClick={() => {
                                        const variant = data.variants.find(item => item.color?.id === color.id);
                                        setSelectedColor(color);
                                        setSelectedSize(variant?.sizes?.[0]?.size || null);
                                        const image = variant?.images?.find(img => img.is_primary) || variant?.images?.[0];
                                        setActiveImage(image?.image || null);
                                    }}
                                />
                            ))}
                        </div>
                    </div>

                    <div className="option-block">
                        <h4>Size</h4>
                        <div className="sizes">
                            {availableSizes.map((item) => (
                                <button
                                    key={item.id}
                                    className={selectedSize?.id === item.size.id ? "size-btn active-size" : "size-btn"}
                                    onClick={() => setSelectedSize(item.size)}
                                >
                                    {item.size.name}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* RIGHT: PURCHASE PANEL */}
                <div className="purchase-panel">
                    <div className="price">
                        {selectedSizeVariant?.has_offer ? (
                            <>
                                <div className="price-row">
                                    <span className="new-price">$\${Number(selectedSizeVariant?.discounted_price).toFixed(2)}</span>
                                    <span className="old-price">$\${Number(selectedSizeVariant?.price).toFixed(2)}</span>
                                </div>
                                <div className="discount-badge">{selectedSizeVariant?.discount_percentage}% OFF</div>
                                <div className="offer-save">You Save $\${Number(selectedSizeVariant?.discount_amount).toFixed(2)}</div>
                            </>
                        ) : (
                            <div className="new-price">$\${Number(selectedSizeVariant?.price).toFixed(2)}</div>
                        )}
                    </div>

                    <div className="stock-status">
                        {selectedSizeVariant?.stock <= 0 ? (
                            <span className="stock-out">Out of Stock</span>
                        ) : (
                            <span className="stock">In Stock : {selectedSizeVariant?.stock}</span>
                        )}
                    </div>
                    
                    <div className="delivery-info-panel">
                        <div className="info-row"><FiTruck className="info-icon" /> Fast & Secure Delivery</div>
                        <div className="info-row"><FiShield className="info-icon" /> One Year Warranty</div>
                        <div className="info-row"><FiLock className="info-icon" /> Secure Transaction</div>
                    </div>

                    <div className="sigle_product_cart-buy">
                        <button className="cart-btn" onClick={addTocart} disabled={selectedSizeVariant?.stock <= 0}>Add to Cart</button>
                        <button className="buy-btn" onClick={addToWishlist}>{isWishlisted ? "Remove from Wishlist" : "Add to Wishlist"}</button>
                    </div>
                </div>
            </div>
`;

if (regex.test(data)) {
    data = data.replace(regex, newContent);
    fs.writeFileSync(path, data);
    console.log("File updated successfully.");
} else {
    console.log("Regex didn't match.");
}
