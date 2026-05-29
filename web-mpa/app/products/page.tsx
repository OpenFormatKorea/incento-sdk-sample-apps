import IncentoBoot from "@/app/components/IncentoBoot";

const PRODUCTS = [
  { id: 1, name: '상품 A', price: '12,000원', description: '첫 번째 상품' },
  { id: 2, name: '상품 B', price: '34,000원', description: '두 번째 상품' },
  { id: 3, name: '상품 C', price: '8,500원', description: '세 번째 상품' },
  { id: 4, name: '상품 D', price: '21,000원', description: '네 번째 상품' },
]

export default function ProductsPage() {
  return (
    <div style={{ padding: 32 }}>
      <IncentoBoot visible={false} />
      <h1 style={{ marginBottom: 24 }}>제품 목록</h1>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
        {PRODUCTS.map(product => (
          <div key={product.id} style={{ border: '1px solid #ddd', borderRadius: 8, padding: 16 }}>
            <h2 style={{ fontSize: 18, marginBottom: 8 }}>{product.name}</h2>
            <p style={{ color: '#555', marginBottom: 4 }}>{product.description}</p>
            <p style={{ fontWeight: 'bold' }}>{product.price}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
