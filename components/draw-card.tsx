"use client";

import { useEffect, useMemo, useState } from "react";
import { acceptDraw, getRoundStatus } from "@/lib/coffee-service";
import { DrawType, Employee } from "@/types";

interface DrawCardProps {
  type: DrawType;
  title: string;
  buttonLabel: string;
}

const TYPE_LABEL: Record<DrawType, string> = {
  coffee: "Café",
  clean: "Limpeza",
};

export function DrawCard({ type, title, buttonLabel }: DrawCardProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [isSpinning, setIsSpinning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [roundNumber, setRoundNumber] = useState(1);
  const [remaining, setRemaining] = useState(0);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [availableEmployees, setAvailableEmployees] = useState<Employee[]>([]);
  const [rollingName, setRollingName] = useState<string | null>(null);
  const [selected, setSelected] = useState<Employee | null>(null);

  const accentClasses =
    type === "coffee"
      ? {
          ring: "from-amber-600 via-amber-700 to-amber-900",
          soft: "bg-gradient-to-br from-amber-700 to-amber-900",
          button: "from-amber-700 via-amber-800 to-amber-950 hover:from-amber-600 hover:via-amber-700 hover:to-amber-900",
          badge: "border-amber-300 bg-amber-100 text-amber-900",
          panel: "from-amber-100 via-white to-amber-50",
        }
      : {
          ring: "from-amber-500 via-amber-700 to-amber-900",
          soft: "bg-gradient-to-br from-amber-600 to-amber-900",
          button: "from-amber-600 via-amber-800 to-amber-950 hover:from-amber-500 hover:via-amber-700 hover:to-amber-900",
          badge: "border-amber-300 bg-amber-100 text-amber-900",
          panel: "from-amber-100 via-white to-amber-50",
        };

  const canDraw = useMemo(() => {
    return !isLoading && !isSpinning && !selected && availableEmployees.length > 0;
  }, [availableEmployees.length, isLoading, isSpinning, selected]);

  async function loadStatus() {
    setIsLoading(true);
    setError(null);

    try {
      const status = await getRoundStatus();
      setRoundNumber(status.round.roundNumber);
      setEmployees(status.employees);
      setAvailableEmployees(status.availableEmployees);
      setRemaining(status.availableEmployees.length);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Erro ao carregar sorteio.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type]);

  async function handleDraw() {
    if (!canDraw) {
      return;
    }

    setError(null);
    setIsSpinning(true);

    const currentPool = availableEmployees.length > 0 ? availableEmployees : employees;
    if (currentPool.length === 0) {
      setIsSpinning(false);
      setError("Cadastre pelo menos um colaborador.");
      return;
    }

    const totalMs = 2400;
    const intervalMs = 90;
    const ticks = Math.floor(totalMs / intervalMs);
    let currentTick = 0;

    const intervalId = window.setInterval(() => {
      const randomEmployee = currentPool[Math.floor(Math.random() * currentPool.length)];
      setRollingName(randomEmployee.name);
      currentTick += 1;

      if (currentTick >= ticks) {
        window.clearInterval(intervalId);
        const finalEmployee = currentPool[Math.floor(Math.random() * currentPool.length)];
        setRollingName(finalEmployee.name);
        setSelected(finalEmployee);
        setIsSpinning(false);
      }
    }, intervalMs);
  }

  async function handleAccept() {
    if (!selected) {
      return;
    }

    try {
      setIsLoading(true);
      await acceptDraw({
        employee: selected,
        type,
        roundNumber,
      });
      setSelected(null);
      setRollingName(null);
      await loadStatus();
    } catch (acceptError) {
      setError(acceptError instanceof Error ? acceptError.message : "Erro ao aceitar sorteio.");
      setIsLoading(false);
    }
  }

  function handleReject() {
    setSelected(null);
    setRollingName(null);
  }

  return (
    <section className="group relative w-full overflow-hidden rounded-[28px] border border-amber-300/70 bg-white/85 p-6 shadow-[0_24px_80px_-28px_rgba(120,53,15,0.26)] backdrop-blur-xl">
      <div className={`absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r ${accentClasses.ring}`} />
      <div className="absolute -right-12 -top-12 h-32 w-32 rounded-full bg-white/45 blur-2xl" />
      <div className="absolute -left-12 bottom-0 h-28 w-28 rounded-full bg-amber-300/25 blur-2xl" />

      <div className="relative">
        <div className="flex items-start justify-between gap-4">
          <div>
            <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] ${accentClasses.badge}`}>
              {TYPE_LABEL[type]}
            </span>
            <h2 className="mt-4 text-2xl font-black leading-tight text-amber-950">{title}</h2>
            <p className="mt-2 max-w-md text-sm leading-6 text-amber-800/90">
              O sorteio percorre a rodada atual e garante que ninguém seja repetido antes de todos participarem.
            </p>
          </div>

          <div className={`hidden h-16 w-16 shrink-0 rounded-3xl ${accentClasses.soft} text-3xl text-white shadow-lg shadow-amber-900/20 sm:flex sm:items-center sm:justify-center`}>
            {type === "coffee" ? "☕" : "🧼"}
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-amber-200 bg-white/80 p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-800">Rodada</p>
            <p className="mt-2 text-3xl font-black text-amber-950">{roundNumber}</p>
          </div>
          <div className="rounded-2xl border border-amber-200 bg-white/80 p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-800">Restantes</p>
            <p className="mt-2 text-3xl font-black text-amber-950">{remaining}</p>
          </div>
          <div className="rounded-2xl border border-amber-200 bg-white/80 p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-800">Colaboradores</p>
            <p className="mt-2 text-3xl font-black text-amber-950">{employees.length}</p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleDraw}
          disabled={!canDraw}
          className={`mt-6 w-full rounded-2xl bg-gradient-to-r ${accentClasses.button} px-6 py-4 text-lg font-black text-amber-50 shadow-lg shadow-amber-900/25 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50`}
        >
          {buttonLabel}
        </button>

        <div className={`relative mt-5 overflow-hidden rounded-[24px] border border-white/80 bg-gradient-to-br ${accentClasses.panel} p-5 shadow-inner`}>
          <div className="pointer-events-none absolute inset-x-6 top-1/2 h-16 -translate-y-1/2 rounded-2xl border border-white/80 bg-white/55 shadow-[0_0_0_1px_rgba(255,255,255,0.4)]" />
          <div className="absolute inset-y-4 left-1/2 w-px -translate-x-1/2 bg-amber-300/50" />

          {selected && (
            <>
              <span className="absolute left-6 top-6 h-2.5 w-2.5 rounded-full bg-amber-500 shadow-[0_0_20px_rgba(180,83,9,0.6)]" />
              <span className="absolute right-10 top-10 h-2 w-2 rounded-full bg-amber-700 shadow-[0_0_20px_rgba(146,64,14,0.6)]" />
              <span className="absolute bottom-8 left-10 h-2 w-2 rounded-full bg-amber-200 shadow-[0_0_20px_rgba(253,230,138,0.7)]" />
              <span className="absolute bottom-6 right-8 h-3 w-3 rounded-full bg-amber-800/80 shadow-[0_0_20px_rgba(120,53,15,0.6)]" />
            </>
          )}

          <div className="relative flex min-h-44 flex-col items-center justify-center text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-amber-800">Roleta do sorteio</p>

            {isSpinning ? (
              <div className="mt-5 w-full max-w-sm rounded-[28px] border border-amber-200/80 bg-white/85 px-6 py-8 shadow-xl shadow-amber-900/10">
                <p className="text-sm font-medium text-amber-800">Sorteando colaborador...</p>
                <p className="mt-3 animate-pulse text-4xl font-black tracking-tight text-amber-950">{rollingName ?? "Preparando a roleta"}</p>
                <div className="mt-5 h-2 overflow-hidden rounded-full bg-amber-200">
                  <div className={`h-full w-1/2 animate-pulse rounded-full bg-gradient-to-r ${accentClasses.ring}`} />
                </div>
              </div>
            ) : selected ? (
              <div className="mt-5 w-full max-w-sm rounded-[28px] border border-amber-200/80 bg-white/90 px-6 py-8 shadow-xl shadow-amber-900/10">
                <p className="text-sm font-medium text-amber-800">Nome sorteado</p>
                <p className="mt-3 text-4xl font-black tracking-tight text-amber-950">{selected.name}</p>
                <p className="mt-4 text-sm leading-6 text-amber-800">Confirme para registrar no histórico ou rejeite caso a pessoa esteja ausente.</p>
              </div>
            ) : (
              <div className="mt-5 w-full max-w-sm rounded-[28px] border border-dashed border-amber-300/90 bg-white/75 px-6 py-8 shadow-sm">
                <p className="text-sm font-medium text-amber-800">Pronto para sortear</p>
                <p className="mt-3 text-2xl font-black text-amber-950">Clique no botão acima</p>
                <p className="mt-4 text-sm leading-6 text-amber-800">A animação dura alguns segundos e para em um nome aleatório da rodada atual.</p>
              </div>
            )}
          </div>
        </div>

        {selected && (
          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={handleAccept}
              className="flex-1 rounded-2xl bg-gradient-to-r from-amber-800 to-amber-950 px-5 py-3.5 font-bold text-amber-50 shadow-lg shadow-amber-900/25 transition hover:-translate-y-0.5"
            >
              Confirmar sorteio
            </button>
            <button
              type="button"
              onClick={handleReject}
              className="flex-1 rounded-2xl border border-amber-300 bg-white/85 px-5 py-3.5 font-bold text-amber-900 transition hover:bg-amber-100"
            >
              Rejeitar por ausência
            </button>
          </div>
        )}

        {error && <p className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</p>}
      </div>
    </section>
  );
}
