import TripForm from '@/components/TripForm'

export default function NewTripPage() {
  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">New Trip</h1>
      <TripForm />
    </div>
  )
}
