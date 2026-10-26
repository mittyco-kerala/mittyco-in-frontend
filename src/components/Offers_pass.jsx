import React from 'react'
import Offer_Query from '../hooks/offers/queries/Offer_Query'

function Offers_pass() {

  const { data } = Offer_Query()
  return (
    <div>
      <div style={{ height: '40px', background: '#F4C430', display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#FFFFFF' }}>
        offers pass as carousal
      </div>

    </div>
  )
}

export default Offers_pass
