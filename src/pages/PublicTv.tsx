import { useParams } from 'react-router-dom'
import TvStage from '../components/TvStage'
import { useTournament } from '../hooks/useTournament'

export default function PublicTv() {
  const { slug } = useParams()
  const { tournament, players, games, loading, notFound } = useTournament({ slug })
  if (loading) return <div className="spinner">Loading…</div>
  if (notFound || !tournament) return <div className="spinner">Tournament not found.</div>
  return (
    <div className="tv-public">
      <TvStage tournament={tournament} players={players} games={games} />
    </div>
  )
}
