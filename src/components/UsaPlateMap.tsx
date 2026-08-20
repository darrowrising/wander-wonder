import { plateKey, type FoundPlate } from '@/domain/plates'
import { usaMapViewBox, usaStatePaths } from '@/data/usa-state-paths'
import { cn } from '@/lib/utils'

export function UsaPlateMap({ found }: { found: Map<string, FoundPlate> }) {
  return (
    <div className="rounded-xl border border-sand-200 bg-white p-3 shadow-sm">
      <svg
        viewBox={usaMapViewBox}
        role="img"
        aria-label="United States map. Spotted plates fill in their states."
        className="pointer-events-none block w-full"
      >
        {usaStatePaths.map((state) => {
          const spotted = found.has(plateKey('usa', state.name))
          return (
            <path
              key={state.abbr}
              d={state.d}
              className={cn(
                'stroke-paper stroke-[1.2] transition-[fill] duration-300',
                spotted ? 'fill-forest' : 'fill-sand-100',
              )}
            />
          )
        })}
      </svg>
    </div>
  )
}
