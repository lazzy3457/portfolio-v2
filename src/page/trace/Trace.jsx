
// import css
import './trace.css';

// import element react
import { useParams } from "react-router-dom";
import React, {useEffect, useState} from "react";

export default function Trace() {3


  const params = useParams();
  const id = params.id;
  console.log ("nengkljqsfkdjbgbkmsdfmbj", id)
  const [trace, setTrace] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const requeteURL = `http://localhost/portfolio_v/v3/portfolio-v2/public/api/getSQL.php?table=trace&id_trace=${id}`

  console.log(requeteURL)

  useEffect(() => {
    fetch(requeteURL)
    .then (response => response.json())
    .then (data => {
      //  // ✅ VÉRIFIEZ et parsez si la donnée est un tableau non vide
      //   const processedData = data.map(item => ({
      //   ...item, // Garde toutes les autres propriétés
      //   // Tente de parser la chaîne JSON en un tableau JavaScript
      //   img_presentation: JSON.parse(item.img_presentation),
      //   content: JSON.parse(item.content)
      // }));
      setTrace(data);
      setLoading(false);
      console.log("vous etes sur le page trace")
      console.log("Trace data:", data);
    })
    .catch (error => {
      setLoading(false);
      setError(error.message);
      console.error("Error fetching trace data:", error);
    });
  })
  console.log("avant teste")
  console.log("je suis un item", trace)
  console.log("l'id est ", params.id)
  // console.log("je suis un item img", trace[0].content)
  
  if (loading) {
          return <p>Chargement des traces...</p>;
      }
    if (error) {
        return <p>Erreur lors du chargement : {error}</p>;
    }
  
  const dataToMap = trace;

  if (Array.isArray(dataToMap)) {
    return (
      <>
        {trace.map((item) => (    
          <>
            <section id="hero_trace">
              <h1>{ item.title }</h1>
              <div id="img_presentation">
                {item.img_presentation.map((imgSrc, index) => (
                  <img key={index} src={`./../src/assets/trace/${id}/${imgSrc}`} alt={`Illustration ${index + 1} de la trace`} />
                ))}
              </div>
            </section>
            <section id="presentation_trace">
                {item.content.map((content_info, index) => (
                  <ContentTrace 
                    index={index} 
                    content_info={content_info} 
                    id={id}
                  /> 
                ))}
            </section>
          </>
        ))}
      </>
    )
  }
  else {
    console.log("je ne suis pas un tableau")
  }
}

function ContentTrace({index, content_info, id}) {

  if (index === 0) {
    return <Amorse content_info={content_info} />
  } else  {
    return <Paragraphe content_info={content_info} id={id} />
  }
}

function Amorse({content_info}) {
  return (
    <div className="conteneur_paragraphe">
      <p className="amorse">
        {content_info.content_paragraphe[0].paragraphe}
      </p>
    </div>
  )
}

function Paragraphe({content_info, id}) {
  return (
    <div className="content_info">
      <h2>
        { content_info.title }
      </h2>
      {content_info.content_paragraphe.map((content_paragraphe, index) => (
        <div className="conteneur_paragraphe">
          <p className="paragraphe">
            { content_paragraphe.paragraphe }
          </p>
          <div className="conteneur_img">
            {content_paragraphe.images.map((imgSrc, index) => (
              // <p>{`./src/assets/trace/${id}/${imgSrc}`}</p>
              
              <img key={index} src={`./../src/assets/trace/${id}/${imgSrc}`} alt={`Illustration ${index + 1} du paragraphe`} />
            ))}
          </div>
      </div>
      ))}
      
    </div>
  )
}
