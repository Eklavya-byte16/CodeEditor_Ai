import React, { useState } from 'react'
import Greating from '../Components/PageComponents/Greating.jsx';

const Dasktop = () => {
  const [State, setState] = useState(true) //true = Greeting , false= Working

  if (State) {
    return(
      <section>
        <Greating />
      </section>
    )
  }else{
    return(
      <section>
        Working Mode
      </section>
    )
  }

}

export default Dasktop