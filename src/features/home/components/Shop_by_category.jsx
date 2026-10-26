import { useRef, useState, useEffect, useMemo } from "react";
import ShopBy_categoryQuery from "../../shop_by_category/queries/ShopBy_categoryQuery";
import "../styles/ShopBy-category.css";

import specialOffer from '../../../assets/specialOffer-image.jpg';

import { useNavigate } from "react-router-dom";
import Offer_Query from "../../../hooks/offers/queries/Offer_Query";
import { isOfferActive } from "../../../hooks/offers/offerEligibility";
import { RiArrowUpWideLine } from "react-icons/ri";
import { getImageUrl } from "../../../utils/imageUrl";
function Shop_by_category({ categories: providedCategories }) {

    const hasProvidedCategories = Array.isArray(providedCategories);
    const { data: rawCategories, isLoading } = ShopBy_categoryQuery({ enabled: !hasProvidedCategories });
    const categories = useMemo(
        () => (hasProvidedCategories ? providedCategories : (Array.isArray(rawCategories) ? rawCategories : [])),
        [hasProvidedCategories, providedCategories, rawCategories]
    );

    const navigate = useNavigate();
    const { data: rawOffers = [] } = Offer_Query();
    const offers = Array.isArray(rawOffers) ? rawOffers : rawOffers?.results || [];
    const activeOffer = offers.find(isOfferActive);


    const categorySliderRef = useRef(null);
    const subCategorySliderRef = useRef(null);

    const [selectedCategory, setSelectedCategory] = useState(null);
    const [closing, setClosing] = useState(false);


    const closeSubCategory = () => {
        setClosing(true);

        setTimeout(() => {
            setSelectedCategory(null);
            setClosing(false);
        }, 300);
    };

    const [categoryArrow, setCategoryArrow] = useState({
        left: false,
        right: true
    });


    const [subCategoryArrow, setSubCategoryArrow] = useState({
        left: false,
        right: true
    });

    const checkCategoryScroll = () => {

        const container = categorySliderRef.current;

        if (!container) return;

        const hasScroll =
            container.scrollWidth > container.clientWidth + 5;

        const newLeft =
            hasScroll &&
            container.scrollLeft > 5;

        const newRight =
            hasScroll &&
            container.scrollLeft + container.clientWidth <
            container.scrollWidth - 5;


        setCategoryArrow((previous) => {

            if (
                previous.left === newLeft &&
                previous.right === newRight
            ) {
                return previous;
            }

            return {
                left: newLeft,
                right: newRight
            };

        });

    };

    const checkSubCategoryScroll = () => {

        const container = subCategorySliderRef.current;

        if (!container) return;

        const hasScroll =
            container.scrollWidth > container.clientWidth + 5;

        const newLeft =
            hasScroll &&
            container.scrollLeft > 5;

        const newRight =
            hasScroll &&
            container.scrollLeft + container.clientWidth <
            container.scrollWidth - 5;


        setSubCategoryArrow((previous) => {

            if (
                previous.left === newLeft &&
                previous.right === newRight
            ) {
                return previous;
            }

            return {
                left: newLeft,
                right: newRight
            };

        });

    };


    const categoryItems = activeOffer
        ? [{ id: `offer-${activeOffer.id}`, name: "OFFERS", image: specialOffer, type: "offer" }, ...categories]
        : categories;



    useEffect(() => {

        checkCategoryScroll();
        const category =
            categorySliderRef.current;
        category?.addEventListener(
            "scroll",
            checkCategoryScroll
        );
        return () => {
            category?.removeEventListener(
                "scroll",
                checkCategoryScroll
            );
        }
    }, [categories]);


    useEffect(() => {
        checkSubCategoryScroll();
        const sub = subCategorySliderRef.current;
        sub?.addEventListener(
            "scroll",
            checkSubCategoryScroll
        );

        return () => {
            sub?.removeEventListener(
                "scroll",
                checkSubCategoryScroll
            );
        }

    }, [selectedCategory]);

    const scrollCategory = (direction) => {

        const container =
            categorySliderRef.current;
        if (!container) return;
        container.scrollBy({
            left:
                direction === "right"
                    ? 250
                    : -250,

            behavior: "smooth"
        });

    };

    const scrollSubCategory = (direction) => {
        const container =
            subCategorySliderRef.current;
        if (!container) return;

        container.scrollBy({
            left:
                direction === "right"
                    ? 250
                    : -250,

            behavior: "smooth"
        });

    };

    const selectCategory = (category) => {
        if (category.type === "offer") {
            navigate("/shop?offer=true");
            return;
        }

        // Categories do not need subcategories to be useful. Open their
        // category listing directly instead of rendering an empty panel.
        if (!category.subcategories?.length) {
            navigate(`/shop?category=${category.id}`);
            return;
        }

        setSelectedCategory(category);

        setTimeout(() => {
            checkSubCategoryScroll();
        }, 100);

    };

    if (isLoading) {
        return (
            <section className="shop-category">
                <div className="slider-wrapper">
                    <div className="category-container" style={{ overflow: 'hidden' }}>
                        {Array.from({ length: 6 }).map((_, i) => (
                            <div key={i} className="category-card">
                                <div className="image-circle skeleton"></div>
                                <div className="skeleton skeleton-text" style={{ width: '60%', margin: '15px auto 0' }}></div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>
        );
    }




    return (
        <section className="shop-category">
            {/* CATEGORY SLIDER */}

            <div className="slider-wrapper">

                {categoryArrow.left &&
                    <button
                        className="slider-arrow left"
                        onClick={() => scrollCategory("left")}
                    >
                        ‹
                    </button>
                }


                <div
                    className={`category-container ${categoryArrow.left || categoryArrow.right ? "is-scrollable" : ""}`}
                    ref={categorySliderRef}
                >

                    {categoryItems.map((item) => (

                        <div
                            key={item.id}
                            className={
                                `
                            category-card
                            ${selectedCategory?.id === item.id ? "active-category" : ""}`} onClick={() => selectCategory(item)} >
                            <div className="image-circle">

                                <img
                                    src={item.type === "offer" ? item.image : getImageUrl(item.image)}
                                    alt={item.name}
                                />
                            </div>

                            <p>
                                {item.name}
                            </p>
                        </div>
                    ))
                    }

                </div>

                {categoryArrow.right &&
                    <button type="button" className="slider-arrow right" onClick={() => scrollCategory("right")}>
                        ›
                    </button>
                }

            </div>

            {/* SUB CATEGORY AREA */}

            {selectedCategory &&

                <div className={`subcategory-section ${closing ? "subcategory-closing" : ""}`}>


                    <div className="subcategory-top" >
                        <div className="subcategory-top-title">
                            <h3>
                                {selectedCategory.name}
                            </h3>
                        </div>

                        <button type="button" className="subcategory-top-title-arrow" onClick={closeSubCategory} aria-label="Close subcategories">
                            <RiArrowUpWideLine size={30} />
                        </button>
                    </div>


                    <div className="slider-wrapper">

                        {subCategoryArrow.left &&
                            <button type="button" className="slider-arrow left" onClick={() => scrollSubCategory("left")}>
                                ‹
                            </button>
                        }


                        <div
                            className={`subcategory-container ${subCategoryArrow.left || subCategoryArrow.right ? "is-scrollable" : ""}`}
                            ref={subCategorySliderRef}
                        >

                            {selectedCategory.subcategories?.map(
                                (item) => (
                                    <button
                                        type="button"
                                        className="subcategory-card"
                                        key={item.id}
                                        onClick={() => navigate(
                                            `/shop?category=${selectedCategory.id}&subcategory=${item.id}`
                                        )}
                                    >

                                        <div className="image-circle">
                                            <img src={getImageUrl(item.image) || getImageUrl(selectedCategory.image)} alt={item.name} />
                                        </div>

                                        <p>
                                            {item.name}
                                        </p>
                                    </button>
                                )
                            )
                            }
                        </div>


                        {subCategoryArrow.right &&

                            <button
                                type="button"
                                className="slider-arrow right"
                                onClick={() => scrollSubCategory("right")}
                            >
                                ›
                            </button>
                        }
                    </div>
                </div>
            }

        </section>
    );
}



export default Shop_by_category;
