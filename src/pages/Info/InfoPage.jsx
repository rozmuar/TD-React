import { Helmet } from 'react-helmet-async'

function InfoPage({ title, children }) {
  return (
    <>
      <Helmet>
        <title>{title} — Top Disc</title>
      </Helmet>
      <h1>{title}</h1>
      {children || <p>Раздел находится в разработке.</p>}
    </>
  )
}

export default InfoPage
