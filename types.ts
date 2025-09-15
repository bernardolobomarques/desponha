export enum Priority {
  High = 'Alta',
  Medium = 'Média',
  Low = 'Baixa',
}

export interface PantryItem {
  id: string;
  name: string;
  quantity: number;
  expiryDate: string; // YYYY-MM-DD
  priority: Priority;
}

export type NewPantryItem = Omit<PantryItem, 'id' | 'priority'>;

export interface AIParsedItem {
  name: string; // Literal name from receipt
  standardizedName: string; // Clean, translated name
  quantity: number;
  expiryDate: string;
}

export enum AppView {
    List = 'list',
    AddReceipt = 'addReceipt'
}
