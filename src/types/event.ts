export interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  location: string;
  createdBy: string;
  registeredUsers: string[];
  image: string;
  totalSeats: number;
  availableSeats: number;
}
