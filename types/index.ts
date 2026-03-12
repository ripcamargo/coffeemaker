import { Timestamp } from "firebase/firestore";

export type DrawType = "coffee" | "clean";

export interface Employee {
  id: string;
  name: string;
  createdAt?: Timestamp;
}

export interface Round {
  id: string;
  type: DrawType;
  roundNumber: number;
  createdAt?: Timestamp;
}

export interface Draw {
  id: string;
  employeeId: string;
  employeeName: string;
  type: DrawType;
  roundNumber: number;
  date?: Timestamp;
  accepted: boolean;
}

export interface CoffeePurchase {
  id: string;
  buyerName: string;
  purchaseDate?: Timestamp;
  createdAt?: Timestamp;
}

export interface RoundStatus {
  round: Round;
  employees: Employee[];
  availableEmployees: Employee[];
}
