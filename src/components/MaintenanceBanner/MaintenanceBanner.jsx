const bannerStyle = {
  background: '#fff3cd',
  color: '#664d03',
  borderBottom: '1px solid #ffe69c',
  textAlign: 'center',
  padding: '10px 16px',
  fontSize: '14px',
  lineHeight: 1.4,
}

function MaintenanceBanner() {
  return (
    <div style={bannerStyle}>
      На сайте ведутся технические работы. Приносим свои извинения за доставленные неудобства.
    </div>
  )
}

export default MaintenanceBanner
