import "../styles/Wishlist.css";
import { FiX } from "react-icons/fi";
import WishlistQuery from "../queries/WishlistQuery";
import { Wishlist_delete } from "../api/Wishlisht_Api";
import { Link, useNavigate } from "react-router-dom";
import { AiOutlineDoubleRight } from "react-icons/ai";
import showToast from "../../../utils/toast";
import { getImageUrl } from "../../../utils/imageUrl";
import DirhamAmount from "../../../components/DirhamAmount";




export default function Wishlist() {

    const navigate = useNavigate()


    const { data = [], isLoading, error, refetch } = WishlistQuery()
    const wishlistItems = Array.isArray(data) ? data : [];

    const removeWishlist = async (id) => {

        try {
            await Wishlist_delete(id);

            // refresh wishlist data
            refetch();

            showToast.success("Product removed in wishlist ")

        } catch (error) {
            console.log(error);
        }
    };


    return (
        <div className="wishlist-page">
            <div className="toshop">
                <Link to='/shop'>Shop</Link>
                <AiOutlineDoubleRight />
            </div>

            <div className="wishlist-header">

                <div>
                    <h1>My Wishlist</h1>
                    <p>A curated collection of your most desired pieces.</p>
                </div>


            </div>


            <div className={`wishlist-grid ${wishlistItems.length <= 3 ? "few-products" : "many-products"}`}>

                {isLoading ? (
                    <div className="wishlist-state" aria-live="polite">Loading your wishlist...</div>
                ) : error ? (
                    <div className="wishlist-state" role="alert">
                        <p>We couldn&apos;t load your wishlist.</p>
                        <button type="button" onClick={() => refetch()}>Try again</button>
                    </div>
                ) : wishlistItems.length === 0 ? (
                    <div className="wishlist-state">
                        <p>Your wishlist is empty.</p>
                        <Link to="/shop">Explore products</Link>
                    </div>
                ) : wishlistItems.map((item) => (
                    <div className="wishlist-card" key={item.id} >

                        <button
                            className="remove-btn"
                            onClick={() => removeWishlist(item.id)}
                        >
                            <FiX />
                        </button>

                        <img
                            src={getImageUrl(item.product_image)}
                            alt={item.product_name}
                        />

                        {
                            item.has_offer && (

                                <span className="wishlist-offer-badge">

                                    {item.discount_percentage}% OFF

                                </span>

                            )
                        }

                        <div className="wishlist-info">

                            <div className="pro-category_wishlist">
                                <span>{item.category}</span>
                            </div>

                            <h3>{item.product_name}</h3>

                            <div className="price">

                                {

                                    item.has_offer ? (

                                        <div className="wishlist-price-box">

                                            <span className="wishlist-old-price">
                                                <DirhamAmount value={item.original_price} />
                                            </span>

                                            <span className="wishlist-new-price">
                                                <DirhamAmount value={item.discounted_price} />
                                            </span>

                                        </div>

                                    ) : (

                                        <span className="wishlist-new-price">
                                            <DirhamAmount value={item.original_price} />
                                        </span>

                                    )

                                }

                            </div>

                            <button onClick={() => navigate(
                                `/single/${item.product}?variant=${item.variant}&size=${item.variant_size}`
                            )}>View More</button>

                        </div>

                    </div>
                ))}
            </div>



        </div>
    );
}
