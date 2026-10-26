import React, { useEffect, useState } from "react";

import { ImTruck } from "react-icons/im";
import { MdOutlinePayments } from "react-icons/md";
import { RiCustomerService2Line } from "react-icons/ri";
import { MdOutlineWorkspacePremium } from "react-icons/md";

function Our_speciality() {

    const specialityData = [
        {
            id: 1,
            icon: <ImTruck />,
            title: "RELIABLE SHIPPING",
            desc: "Safe & secure delivery"
        },
        {
            id: 2,
            icon: <MdOutlinePayments />,
            title: "SECURE PAYMENT",
            desc: "100% secure checkout"
        },
        {
            id: 3,
            icon: <RiCustomerService2Line />,
            title: "CUSTOMER SUPPORT",
            desc: "We are here to help"
        },
        {
            id: 4,
            icon: <MdOutlineWorkspacePremium />,
            title: "PREMIUM QUALITY",
            desc: "Finest quality assured"
        }
    ];

    const [isMobile, setIsMobile] = useState(
        window.innerWidth <= 990
    );


    useEffect(() => {

        const handleResize = () => {

            setIsMobile(
                window.innerWidth <= 990
            );

        };

        window.addEventListener(
            "resize",
            handleResize
        );

        return () => {

            window.removeEventListener(
                "resize",
                handleResize
            );

        };

    }, []);


    const displayData = isMobile
        ? [...specialityData, ...specialityData]
        : specialityData;


    return (

        <div className="speciality_wrapper">

            <div
                className={`speciality_track ${isMobile
                        ? "speciality_mobile_track"
                        : ""
                    }`}
            >

                {displayData.map((item, index) => (

                    <div
                        className="speciality_boxes"
                        key={`${item.id}-${index}`}
                    >

                        <div className="speciality_icon">

                            {item.icon}

                        </div>

                        <h4>
                            {item.title}
                        </h4>

                        <p>
                            {item.desc}
                        </p>

                    </div>

                ))}

            </div>

        </div>

    );

}

export default Our_speciality;
