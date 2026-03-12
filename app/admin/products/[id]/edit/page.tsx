import ProductFormPage from '../../ProductFormPage'

interface Props {
  params: Promise<{ id: string }>
}

export default function EditProductPage({ params }: Props) {
  return <ProductFormPage params={params} isNew={false} />
}
