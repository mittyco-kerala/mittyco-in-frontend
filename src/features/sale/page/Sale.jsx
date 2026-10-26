import { useEffect, useMemo, useState } from 'react'
import '../styles/Sale_page.css'
import Product_card from '../components/Product_card'
import Product_Query from '../queries/Product_Query'
import { NavLink, useSearchParams, useNavigate } from "react-router-dom"
import ShopBy_categoryQuery from '../../shop_by_category/queries/ShopBy_categoryQuery'
import { getImageUrl } from '../../../utils/imageUrl'

function Sale() {



    const navigate = useNavigate()
    const { data: rawDataFilter } = ShopBy_categoryQuery()
    const data_filter = useMemo(
        () => (Array.isArray(rawDataFilter) ? rawDataFilter : []),
        [rawDataFilter]
    )

    const [isMobile, setIsMobile] = useState(window.innerWidth <= 1140)
    const [showFilter, setShowFilter] = useState(false)

    const [searchParams, setSearchParams] = useSearchParams()

    const page = Number(searchParams.get("page") || 1)
    const pageSize = Number(searchParams.get("page_size") || 14)
    const categoryId = searchParams.get("category")
    const subcategoryId = searchParams.get("subcategory")
    const filter = { ...Object.fromEntries(searchParams.entries()), page, page_size: pageSize }

    const isOfferPage = searchParams.get("offer") === "true"

    const { data, isLoading, error } = Product_Query(filter)
    const products = data?.results || []

    // Derive the selected category from the URL so direct/shared shop links
    // always show the matching category and subcategory image.
    const selectedCategory = useMemo(() => {
        if (data_filter.length === 0) return null

        if (categoryId) {
            return data_filter.find((category) => String(category.id) === String(categoryId)) || null
        }

        if (subcategoryId) {
            return data_filter.find((category) => category.subcategories?.some(
                (subcategory) => String(subcategory.id) === String(subcategoryId)
            )) || null
        }

        return data_filter[0]
    }, [categoryId, data_filter, subcategoryId])

    const selectCategory = (category) => {
        const next = new URLSearchParams()
        next.set("category", String(category.id))
        setSearchParams(next)
        setShowFilter(false)
    }

    const selectedSubcategory = selectedCategory?.subcategories?.find(
        (subcategory) => String(subcategory.id) === String(subcategoryId)
    )

    // Mobile resize
    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth <= 1140)

            if (window.innerWidth > 1140) {
                setShowFilter(false)
            }
        }

        handleResize()

        window.addEventListener("resize", handleResize)

        return () => {
            window.removeEventListener("resize", handleResize)
        }
    }, [])

    return (
        <div className='salePage-main' >
            {/* Header */}
            <div className="page_header">
                <div className="page_head">
                    <h1 className="page_title">
                        {isOfferPage
                            ? "Special Offers"
                            : "Shop All Collections"}
                    </h1>

                    <p className="title_description">
                        {isOfferPage
                            ? "Explore our exclusive discounted products."
                            : "Explore our curated collection of premium tech and lifestyle products."}
                    </p>
                </div>

                <div className="salepage_button">
                    {isMobile && (
                        <button
                            type="button"
                            className="product_count"
                            onClick={() => setShowFilter(!showFilter)}
                            aria-expanded={showFilter}
                        >
                            {showFilter ? "Close Filter" : "Filter"}
                        </button>
                    )}

                </div>
            </div>

            {/* SHOP CATEGORY FILTER */}
            {showFilter && (
                <div className="shop_category_filter">
                    {/* Categories */}
                    <div className="shop_filter_box">
                        <h3 className="shop_filter_title">
                            Categories
                        </h3>

                        <div className="shop_category_list">
                            {data_filter.map(category => (
                                <div  key={category.id}>
                                    <button
                                       
                                        className={`shop_category_item ${selectedCategory?.id === category.id
                                            ? "shop_category_active"
                                            : ""
                                            }`}
                                        onClick={() => selectCategory(category)} >

                                        {category.name}
                                    </button>

                                </div>

                            ))}


                            <button type="button" className="shop_category_item" onClick={() => { navigate("/shop"); setShowFilter(false); }}>
                                See all
                            </button>
                        </div>
                    </div>

                    {/* Subcategories */}
                    <div className="shop_filter_box">
                        <h3 className="shop_filter_title">
                            Subcategories
                        </h3>

                        <div className="shop_subcategory_list">
                            {selectedCategory?.subcategories?.map(sub => (
                                <NavLink
                                    key={sub.id}
                                    className={`shop_subcategory_item ${String(sub.id) === String(subcategoryId)
                                        ? "shop_subcategory_active"
                                        : ""
                                        }`}
                                    to={`/shop?category=${selectedCategory.id}&subcategory=${sub.id}`}
                                    onClick={() => setShowFilter(false)}
                                >
                                    {sub.name}
                                </NavLink>
                            ))}
                        </div>
                    </div>

                    {/* Category Image */}
                    <div className="shop_filter_box">
                        <h3 className="shop_filter_title">
                            Preview
                        </h3>

                        <div className="shop_category_preview">
                            {(selectedSubcategory?.image || selectedCategory?.image) && (
                                <img
                                    src={getImageUrl(selectedSubcategory?.image || selectedCategory.image)}
                                    alt={selectedSubcategory?.name || selectedCategory.name}
                                />
                            )}
                        </div>
                    </div>
                </div>
            )
            }

            {/* PRODUCTS */}
            <div className="shop_page">
                <div>
                    <Product_card
                        products={products}
                        isLoading={isLoading}
                        error={error}
                        page={page}
                        pageSize={pageSize}
                        count={data?.count}
                        onPageChange={(nextPage) => { const next = new URLSearchParams(searchParams); next.set("page", String(nextPage)); setSearchParams(next); }}
                    />
                </div>
            </div>
        </div >
    )
}

export default Sale
