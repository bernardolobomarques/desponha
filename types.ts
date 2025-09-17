export enum Priority {
  High = 'Alta',
  Medium = 'Média',
  Low = 'Baixa',
}

// Represents a single batch of an item with a specific expiry date.
export interface PantryItemInstance {
  id: string;
  quantity: number;
  expiryDate: string; // YYYY-MM-DD
}

// Represents a group of the same item, which can have multiple batches/instances.
export interface PantryItemGroup {
  id: string;
  name: string;
  instances: PantryItemInstance[];
  priority: Priority;
}

// Represents a new item being added from a form or receipt scan.
export type NewPantryItem = {
  name: string;
  quantity: number;
  expiryDate: string;
};

// Data structure returned from the AI service.
export interface AIParsedItem {
  name: string; // Literal name from receipt
  standardizedName: string; // Clean, translated name
  quantity: number;
  expiryDate: string;
}

export enum AppView {
    List = 'list',
    AddReceipt = 'addReceipt',
    AddManual = 'addManual'
}
