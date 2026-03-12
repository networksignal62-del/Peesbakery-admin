import ProductFormPage from '../ProductFormPage'

export default function NewProductPage() {
  return <ProductFormPage params={Promise.resolve({ id: 'new' })} isNew={true} />
}
