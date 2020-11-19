import React, { useEffect } from "react"

function Adsense() {

    
      useEffect(()=>{
        (window.adsbygoogle = window.adsbygoogle || []).push({});   
      })
        return(
            <div style={{padding: 8}}>
                <ins class="adsbygoogle"
                    style={{display: "block"}}
                    data-ad-client="ca-pub-5033331279793069"
                    data-ad-slot="8996249540"
                    data-ad-format="auto"
                    data-full-width-responsive="true"></ins>
            </div>
        )
}
export default Adsense