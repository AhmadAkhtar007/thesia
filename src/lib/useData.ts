import { useCallback, useEffect, useState } from 'react';
import { repo } from './repo';
import type { Person, Project } from './types';

// Shared, cached loaders so moving between pages doesn't refetch everything.
type Cache<T> = { data: T[] | null; promise: Promise<T[]> | null; listeners: Set<() => void> };
const projectsCache: Cache<Project> = { data: null, promise: null, listeners: new Set() };
const peopleCache: Cache<Person> = { data: null, promise: null, listeners: new Set() };

function useCached<T>(cache: Cache<T>, load: () => Promise<T[]>) {
  const [, force] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(
    (fresh = false) => {
      if (fresh || !cache.promise) {
        cache.promise = load()
          .then((d) => {
            cache.data = d;
            cache.listeners.forEach((l) => l());
            return d;
          })
          .catch((e) => {
            cache.promise = null;
            setError(e?.message || 'Could not load data');
            return [];
          });
      }
      return cache.promise;
    },
    [cache, load]
  );

  useEffect(() => {
    const l = () => force((n) => n + 1);
    cache.listeners.add(l);
    if (!cache.data) fetchData();
    return () => {
      cache.listeners.delete(l);
    };
  }, [cache, fetchData]);

  return { data: cache.data || [], loading: !cache.data && !error, error, reload: () => fetchData(true) };
}

export function useProjects() {
  const r = useCached(projectsCache, repo.listProjects);
  return { projects: r.data, loading: r.loading, error: r.error, reload: r.reload };
}

export function usePeople() {
  const r = useCached(peopleCache, repo.listPeople);
  return { people: r.data, loading: r.loading, error: r.error, reload: r.reload };
}

function refresh<T>(cache: Cache<T>, load: () => Promise<T[]>) {
  cache.promise = load().then((d) => {
    cache.data = d;
    cache.listeners.forEach((l) => l());
    return d;
  });
  return cache.promise;
}

/** Reload projects after creating or closing one. */
export const invalidateProjects = () => refresh(projectsCache, repo.listProjects);
/** Reload people after a profile change. */
export const invalidatePeople = () => refresh(peopleCache, repo.listPeople);
