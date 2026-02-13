import { Link } from 'react-router-dom'

function NotFound() {
  return (
    <div className="container" style={{ textAlign: 'center', padding: '100px 20px' }}>
      <h1 style={{ fontSize: '120px', margin: '0', color: '#333' }}>404</h1>
      <p style={{ fontSize: '24px', margin: '20px 0', color: '#666' }}>
        Страница не найдена
      </p>
      <p style={{ fontSize: '16px', margin: '20px 0 40px', color: '#999' }}>
        К сожалению, запрашиваемая вами страница не существует или была перемещена.
      </p>
      <Link 
        to="/" 
        style={{
          display: 'inline-block',
          padding: '12px 32px',
          background: '#4CAF50',
          color: 'white',
          textDecoration: 'none',
          borderRadius: '4px',
          fontSize: '16px'
        }}
      >
        Вернуться на главную
      </Link>
    </div>
  )
}

export default NotFound
