
import React from "react";
import TicketCard from "../TicketCard";
import { Ticket, Stage } from "@/types";

interface TicketCardRowProps {
  ticket: Ticket;
  stages: Stage[];
  onStatusChange: (ticketId: string, newStageNumber: number, systemNumber?: number) => void;
}

const TicketCardRow: React.FC<TicketCardRowProps> = ({ ticket, stages, onStatusChange }) => {
  return (
    <TicketCard
      key={ticket.id}
      ticket={ticket}
      stages={stages}
      onStatusChange={onStatusChange}
    />
  );
};

export default TicketCardRow;
