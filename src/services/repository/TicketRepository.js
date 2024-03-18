class TicketRepository {
    constructor(TicketManager) {
      this.TicketManager = TicketManager;
    }
  
    getAll = (userId) => {
      return this.TicketManager.getTicketsByUser(userId);
    }
  
    create = (userId) => {
      return this.TicketManager.createTicket(userId);
    }
  
   
  }
  
  export default TicketRepository;
  