import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  Timestamp,
  where,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { CoffeePurchase, Draw, DrawType, Employee, Round, RoundStatus } from "@/types";

const EMPLOYEES_COLLECTION = "employees";
const DRAWS_COLLECTION = "draws";
const ROUNDS_COLLECTION = "rounds";
const COFFEE_PURCHASES_COLLECTION = "coffeePurchases";
const GLOBAL_ROUND_TYPE: DrawType = "coffee";

function mapEmployee(docItem: { id: string; data: () => Record<string, unknown> }): Employee {
  const data = docItem.data();
  return {
    id: docItem.id,
    name: String(data.name ?? ""),
    createdAt: data.createdAt as Employee["createdAt"],
  };
}

function mapRound(docItem: { id: string; data: () => Record<string, unknown> }): Round {
  const data = docItem.data();
  return {
    id: docItem.id,
    type: data.type as DrawType,
    roundNumber: Number(data.roundNumber ?? 1),
    createdAt: data.createdAt as Round["createdAt"],
  };
}

function mapDraw(docItem: { id: string; data: () => Record<string, unknown> }): Draw {
  const data = docItem.data();
  return {
    id: docItem.id,
    employeeId: String(data.employeeId ?? ""),
    employeeName: String(data.employeeName ?? ""),
    type: data.type as DrawType,
    roundNumber: Number(data.roundNumber ?? 1),
    date: data.date as Draw["date"],
    accepted: Boolean(data.accepted),
  };
}

function mapCoffeePurchase(docItem: { id: string; data: () => Record<string, unknown> }): CoffeePurchase {
  const data = docItem.data();
  return {
    id: docItem.id,
    buyerName: String(data.buyerName ?? ""),
    purchaseDate: data.purchaseDate as CoffeePurchase["purchaseDate"],
    createdAt: data.createdAt as CoffeePurchase["createdAt"],
  };
}

export async function getEmployees(): Promise<Employee[]> {
  const employeesRef = collection(db, EMPLOYEES_COLLECTION);
  const employeesQuery = query(employeesRef, orderBy("createdAt", "asc"));
  const snapshot = await getDocs(employeesQuery);
  return snapshot.docs.map(mapEmployee);
}

export async function addEmployee(name: string): Promise<void> {
  const normalizedName = name.trim();
  if (!normalizedName) {
    throw new Error("Nome inválido.");
  }

  await addDoc(collection(db, EMPLOYEES_COLLECTION), {
    name: normalizedName,
    createdAt: serverTimestamp(),
  });
}

export async function removeEmployee(employeeId: string): Promise<void> {
  await deleteDoc(doc(db, EMPLOYEES_COLLECTION, employeeId));
}

async function createRound(type: DrawType, roundNumber: number): Promise<Round> {
  const roundRef = await addDoc(collection(db, ROUNDS_COLLECTION), {
    type,
    roundNumber,
    createdAt: serverTimestamp(),
  });

  return {
    id: roundRef.id,
    type,
    roundNumber,
  };
}

async function getCurrentRound(): Promise<Round> {
  const roundsRef = collection(db, ROUNDS_COLLECTION);
  const roundsQuery = query(roundsRef, where("type", "==", GLOBAL_ROUND_TYPE));

  const snapshot = await getDocs(roundsQuery);

  if (snapshot.empty) {
    return createRound(GLOBAL_ROUND_TYPE, 1);
  }

  const rounds = snapshot.docs.map(mapRound);
  const latestRound = rounds.reduce((currentLatest, currentRound) => {
    if (!currentLatest || currentRound.roundNumber > currentLatest.roundNumber) {
      return currentRound;
    }

    return currentLatest;
  }, null as Round | null);

  if (!latestRound) {
    return createRound(GLOBAL_ROUND_TYPE, 1);
  }

  return latestRound;
}

async function getAcceptedDraws(roundNumber: number): Promise<Draw[]> {
  const drawsRef = collection(db, DRAWS_COLLECTION);
  const drawsQuery = query(drawsRef, where("accepted", "==", true));

  const snapshot = await getDocs(drawsQuery);
  return snapshot.docs
    .map(mapDraw)
    .filter((draw) => draw.roundNumber === roundNumber);
}

export async function getRoundStatus(): Promise<RoundStatus> {
  const employees = await getEmployees();
  if (employees.length === 0) {
    throw new Error("Cadastre pelo menos um colaborador.");
  }

  let round = await getCurrentRound();
  let acceptedDraws = await getAcceptedDraws(round.roundNumber);

  if (acceptedDraws.length >= employees.length) {
    round = await createRound(GLOBAL_ROUND_TYPE, round.roundNumber + 1);
    acceptedDraws = [];
  }

  const selectedIds = new Set(acceptedDraws.map((draw) => draw.employeeId));
  let availableEmployees = employees.filter((employee) => !selectedIds.has(employee.id));

  if (availableEmployees.length === 0) {
    round = await createRound(GLOBAL_ROUND_TYPE, round.roundNumber + 1);
    availableEmployees = employees;
  }

  return {
    round,
    employees,
    availableEmployees,
  };
}

export async function acceptDraw(input: {
  employee: Employee;
  type: DrawType;
  roundNumber: number;
}): Promise<void> {
  await addDoc(collection(db, DRAWS_COLLECTION), {
    employeeId: input.employee.id,
    employeeName: input.employee.name,
    type: input.type,
    roundNumber: input.roundNumber,
    accepted: true,
    date: serverTimestamp(),
  });
}

export async function getDrawHistory(): Promise<Draw[]> {
  const drawsRef = collection(db, DRAWS_COLLECTION);
  const drawsQuery = query(drawsRef, orderBy("date", "desc"));
  const snapshot = await getDocs(drawsQuery);
  return snapshot.docs.map(mapDraw);
}

export async function addCoffeePurchase(input: { buyerName: string; purchaseDate: string }): Promise<void> {
  const normalizedName = input.buyerName.trim();
  if (!normalizedName) {
    throw new Error("Informe quem comprou o café.");
  }

  if (!input.purchaseDate) {
    throw new Error("Informe a data da compra.");
  }

  const parsedDate = new Date(`${input.purchaseDate}T00:00:00`);

  if (Number.isNaN(parsedDate.getTime())) {
    throw new Error("Data de compra inválida.");
  }

  await addDoc(collection(db, COFFEE_PURCHASES_COLLECTION), {
    buyerName: normalizedName,
    purchaseDate: Timestamp.fromDate(parsedDate),
    createdAt: serverTimestamp(),
  });
}

export async function getCoffeePurchaseHistory(): Promise<CoffeePurchase[]> {
  const purchasesRef = collection(db, COFFEE_PURCHASES_COLLECTION);
  const purchasesQuery = query(purchasesRef, orderBy("purchaseDate", "desc"));
  const snapshot = await getDocs(purchasesQuery);
  return snapshot.docs.map(mapCoffeePurchase);
}

export async function removeCoffeePurchase(purchaseId: string): Promise<void> {
  await deleteDoc(doc(db, COFFEE_PURCHASES_COLLECTION, purchaseId));
}
