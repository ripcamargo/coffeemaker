"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { addEmployee, acceptDraw, getDrawHistory, getRoundStatus, removeEmployee } from "@/lib/coffee-service";
import { Draw, DrawType, Employee } from "@/types";

const drawTypeLabel: Record<DrawType, string> = {
  coffee: "Café",
  clean: "Limpeza",
};

function formatDate(value?: Draw["date"]) {
  if (!value) {
    return "-";
  }

  return value.toDate().toLocaleString("pt-BR");
}

export default function Home() {
  const [drawType, setDrawType] = useState<DrawType>("coffee");
  const [name, setName] = useState("");
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [availableEmployees, setAvailableEmployees] = useState<Employee[]>([]);
  const [draws, setDraws] = useState<Draw[]>([]);
  const [roundNumber, setRoundNumber] = useState(1);
  const [selected, setSelected] = useState<Employee | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSpinning, setIsSpinning] = useState(false);
  const [wheelRotation, setWheelRotation] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const canDraw = useMemo(() => {
    return !isLoading && !isSpinning && !selected && availableEmployees.length > 0;
  }, [availableEmployees.length, isLoading, isSpinning, selected]);

  const wheelPool = useMemo(() => {
    return availableEmployees.length > 0 ? availableEmployees : employees;
  }, [availableEmployees, employees]);

  async function loadData() {
    setIsLoading(true);
    setError(null);

    try {
      const [status, history] = await Promise.all([getRoundStatus(), getDrawHistory()]);
      setRoundNumber(status.round.roundNumber);
      setEmployees(status.employees);
      setAvailableEmployees(status.availableEmployees);
      setDraws(history);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Erro ao carregar dados.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
  }, []);

  async function handleDraw() {
    if (!canDraw) {
      return;
    }

    setError(null);
    setIsSpinning(true);

    const currentPool = availableEmployees;
    const finalEmployee = currentPool[Math.floor(Math.random() * currentPool.length)];
    const selectedIndex = currentPool.findIndex((employee) => employee.id === finalEmployee.id);
    const segmentAngle = 360 / currentPool.length;

    const currentMod = ((wheelRotation % 360) + 360) % 360;
    const desiredMod = ((-selectedIndex * segmentAngle) % 360 + 360) % 360;
    const deltaToTarget = (desiredMod - currentMod + 360) % 360;
    const extraSpins = 6 * 360;
    const targetRotation = wheelRotation + extraSpins + deltaToTarget;

    setWheelRotation(targetRotation);

    window.setTimeout(() => {
      setSelected(finalEmployee);
      setIsSpinning(false);
    }, 3200);
  }

  async function handleAccept() {
    if (!selected) {
      return;
    }

    try {
      setIsLoading(true);
      await acceptDraw({
        employee: selected,
        type: drawType,
        roundNumber,
      });
      setSelected(null);
      await loadData();
    } catch (acceptError) {
      setError(acceptError instanceof Error ? acceptError.message : "Erro ao confirmar sorteio.");
      setIsLoading(false);
    }
  }

  function handleReject() {
    setSelected(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!name.trim()) {
      setError("Informe um nome válido.");
      return;
    }

    try {
      setError(null);
      await addEmployee(name);
      setName("");
      await loadData();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Erro ao adicionar colaborador.");
    }
  }

  async function handleDelete(employeeId: string) {
    try {
      setError(null);
      await removeEmployee(employeeId);
      await loadData();
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Erro ao remover colaborador.");
    }
  }

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8 pb-14">
      <section className="rounded-[34px] border border-amber-300/80 bg-white/90 p-6 shadow-[0_24px_80px_-32px_rgba(120,53,15,0.22)] sm:p-8">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-sm font-semibold uppercase tracking-[0.18em] text-amber-800">Tipo de registro:</span>
          <label className="inline-flex items-center gap-2 rounded-xl border border-amber-300 bg-amber-100 px-4 py-2 text-sm font-semibold text-amber-900">
            <input
              type="radio"
              name="tipo-sorteio"
              checked={drawType === "coffee"}
              onChange={() => setDrawType("coffee")}
              className="h-4 w-4 accent-amber-900"
            />
            Café
          </label>
          <label className="inline-flex items-center gap-2 rounded-xl border border-amber-300 bg-amber-100 px-4 py-2 text-sm font-semibold text-amber-900">
            <input
              type="radio"
              name="tipo-sorteio"
              checked={drawType === "clean"}
              onChange={() => setDrawType("clean")}
              className="h-4 w-4 accent-amber-900"
            />
            Limpeza
          </label>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-amber-300 bg-amber-100 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-800">Rodada</p>
            <p className="mt-2 text-3xl font-black text-amber-950">{roundNumber}</p>
          </div>
          <div className="rounded-2xl border border-amber-300 bg-amber-100 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-800">Restantes</p>
            <p className="mt-2 text-3xl font-black text-amber-950">{availableEmployees.length}</p>
          </div>
          <div className="rounded-2xl border border-amber-300 bg-amber-100 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-800">Colaboradores</p>
            <p className="mt-2 text-3xl font-black text-amber-950">{employees.length}</p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleDraw}
          disabled={!canDraw}
          className="mt-6 w-full rounded-2xl bg-gradient-to-r from-amber-700 via-amber-800 to-amber-950 px-6 py-5 text-xl font-black text-amber-50 shadow-lg shadow-amber-900/25 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
        >
          🎲 Sortear participante ({drawTypeLabel[drawType]})
        </button>

        <div className="relative mt-6 overflow-hidden rounded-[28px] border border-amber-300 bg-gradient-to-br from-amber-100 via-white to-amber-50 p-6 text-center shadow-inner">
          <div className="relative mx-auto flex w-full max-w-[360px] flex-col items-center">
            <div className="mb-3 h-0 w-0 border-l-[15px] border-r-[15px] border-t-[22px] border-l-transparent border-r-transparent border-t-gray-800" />

            <div 
              className="relative h-[300px] w-[300px] rounded-full border-4 border-gray-800 shadow-[0_12px_35px_rgba(0,0,0,0.35)] overflow-hidden"
            >
              <svg
                viewBox="0 0 300 300"
                className="absolute inset-0 w-full h-full"
                style={{
                  transform: `rotate(${wheelRotation}deg)`,
                  transition: isSpinning ? "transform 3.2s cubic-bezier(0.15, 0.85, 0.2, 1)" : "none",
                }}
              >
                {wheelPool.map((employee, index) => {
                  const colors = ["#FF6B6B", "#4ECDC4", "#45B7D1", "#FFA07A", "#98D8C8", "#F7DC6F", "#BB8FCE", "#85C1E2", "#F8B88B", "#52C0A1", "#FF8C94", "#6C5CE7"];
                  const color = colors[index % colors.length];
                  const sliceCount = wheelPool.length;
                  const anglePerSlice = 360 / sliceCount;
                  const startAngle = (anglePerSlice * index - 90) * (Math.PI / 180);
                  const endAngle = (anglePerSlice * (index + 1) - 90) * (Math.PI / 180);
                  const radius = 150;

                  // Calcula pontos para desenhar a fatia
                  const x1 = 150 + radius * Math.cos(startAngle);
                  const y1 = 150 + radius * Math.sin(startAngle);
                  const x2 = 150 + radius * Math.cos(endAngle);
                  const y2 = 150 + radius * Math.sin(endAngle);

                  const largeArc = anglePerSlice > 180 ? 1 : 0;
                  const pathData = `M 150 150 L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`;

                  // Posição do texto no meio da fatia
                  const textAngle = startAngle + (endAngle - startAngle) / 2;
                  const textRadius = 110;
                  const textX = 150 + textRadius * Math.cos(textAngle);
                  const textY = 150 + textRadius * Math.sin(textAngle);
                  const textRotate = ((anglePerSlice * index + anglePerSlice / 2 - 90) % 360);

                  return (
                    <g key={employee.id}>
                      <path d={pathData} fill={color} stroke="white" strokeWidth="2" />
                      <text
                        x={textX}
                        y={textY}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        fill="white"
                        fontSize="12"
                        fontWeight="bold"
                        style={{
                          transform: `rotate(${textRotate}deg)`,
                          transformOrigin: `${textX}px ${textY}px`,
                          pointerEvents: "none",
                          userSelect: "none",
                        }}
                      >
                        {employee.name}
                      </text>
                    </g>
                  );
                })}
              </svg>

              <div className="absolute left-1/2 top-1/2 h-16 w-16 -translate-x-1/2 -translate-y-1/2 rounded-full border-4 border-white bg-white shadow-lg z-10" />
            </div>
          </div>

          <div className="mt-5 min-h-16">
            {isSpinning ? (
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-900">Roleta girando...</p>
            ) : selected ? (
              <>
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-900">Sorteado</p>
                <p className="mt-2 text-4xl font-black tracking-tight text-amber-950">{selected.name}</p>
                <p className="mt-2 text-sm text-amber-800">Registro selecionado: {drawTypeLabel[drawType]}</p>
              </>
            ) : (
              <p className="text-sm text-amber-800">Clique em “Sortear participante” para girar a roleta.</p>
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
              className="flex-1 rounded-2xl border border-amber-300 bg-white px-5 py-3.5 font-bold text-amber-900 transition hover:bg-amber-100"
            >
              Rejeitar por ausência
            </button>
          </div>
        )}
      </section>

      <section className="mt-8 rounded-[32px] border border-amber-300/80 bg-white/90 p-6 shadow-[0_24px_80px_-32px_rgba(120,53,15,0.18)] sm:p-8">
        <h2 className="text-2xl font-black text-amber-950">Participantes</h2>
        <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-3 sm:flex-row">
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Nome do colaborador"
            className="flex-1 rounded-2xl border border-amber-300 bg-white px-4 py-3.5 text-amber-950 outline-none transition focus:border-amber-500 focus:ring-4 focus:ring-amber-100"
          />
          <button
            type="submit"
            className="rounded-2xl bg-gradient-to-r from-amber-700 via-amber-800 to-amber-950 px-5 py-3.5 font-bold text-amber-50"
          >
            Adicionar colaborador
          </button>
        </form>

        {employees.length === 0 ? (
          <p className="mt-5 rounded-2xl border border-dashed border-amber-300 bg-amber-100/70 p-6 text-amber-800">Nenhum colaborador cadastrado.</p>
        ) : (
          <ul className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {employees.map((employee) => (
              <li key={employee.id} className="flex items-center justify-between rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3">
                <span className="font-semibold text-amber-950">{employee.name}</span>
                <button
                  type="button"
                  onClick={() => handleDelete(employee.id)}
                  className="rounded-xl border border-red-300 bg-white px-3 py-1.5 text-sm font-semibold text-red-700 hover:bg-red-50"
                >
                  Remover
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-8 overflow-hidden rounded-[32px] border border-amber-300/80 bg-white/90 shadow-[0_24px_80px_-32px_rgba(120,53,15,0.18)]">
        <div className="flex items-center justify-between border-b border-amber-300 px-6 py-4">
          <h2 className="text-2xl font-black text-amber-950">Histórico</h2>
          <button
            type="button"
            onClick={() => void loadData()}
            className="rounded-xl border border-amber-300 bg-white px-4 py-2 text-sm font-semibold text-amber-900 hover:bg-amber-100"
          >
            Atualizar
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] border-collapse">
            <thead>
              <tr className="bg-amber-100 text-left text-sm text-amber-900">
                <th className="px-6 py-4 font-bold">Data</th>
                <th className="px-6 py-4 font-bold">Colaborador</th>
                <th className="px-6 py-4 font-bold">Tipo</th>
                <th className="px-6 py-4 font-bold">Rodada</th>
              </tr>
            </thead>
            <tbody>
              {draws.length === 0 ? (
                <tr>
                  <td className="px-6 py-8 text-center text-amber-800" colSpan={4}>
                    Nenhum sorteio registrado ainda.
                  </td>
                </tr>
              ) : (
                draws.map((draw, index) => (
                  <tr
                    key={draw.id}
                    className={`border-t border-amber-200 text-sm text-amber-950 ${index % 2 === 0 ? "bg-white" : "bg-amber-50"}`}
                  >
                    <td className="px-6 py-4">{formatDate(draw.date)}</td>
                    <td className="px-6 py-4 font-semibold">{draw.employeeName}</td>
                    <td className="px-6 py-4">{drawTypeLabel[draw.type]}</td>
                    <td className="px-6 py-4 font-semibold">{draw.roundNumber}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {error && <p className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</p>}
    </main>
  );
}
