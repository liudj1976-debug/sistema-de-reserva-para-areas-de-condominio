import React, { useState, useEffect, useMemo } from 'react';
import ReactDOM from 'react-dom/client';

const initialPrices = {
  'Salão de Festas': 227.00,
  'Churrasqueira': 75.00,
};

const PIX_KEY_CNPJ_FORMATTED = '42.181.669/0001-77';
const PIX_KEY_CNPJ_RAW = '42181669000177';
const ADMIN_PASSWORD = 'sindico2025';
const ADMIN_WHATSAPP_NUMBER = '5541999999999'; // Placeholder for admin's WhatsApp

// --- Interfaces ---
interface Space {
  id: number;
  name: string;
  capacity: number;
  image: string;
  features: string[];
  // Fix: Use React.ReactElement to resolve JSX namespace error.
  icon: (props: any) => React.ReactElement;
}

interface Reservation {
  id: string;
  spaceName: string;
  date: string;
  apartment: string;
  status: 'Pendente' | 'Confirmado';
  value: number;
}

// --- Data ---
const spaces: Space[] = [
  {
    id: 1,
    name: 'Salão de Festas',
    capacity: 45,
    image: 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?q=80&w=2070&auto=format&fit=crop',
    features: ['Mesas e cadeiras', 'Ar condicionado'],
    icon: (props) => <i className="fa-solid fa-champagne-glasses text-4xl text-green-800" {...props}></i>,
  },
  {
    id: 2,
    name: 'Churrasqueira',
    capacity: 30,
    image: 'https://images.unsplash.com/photo-1558030006-450675393462?q=80&w=2070&auto=format&fit=crop',
    features: ['Churrasqueira a carvão', 'Pia e bancada', 'Mesas ao ar livre', 'Área coberta'],
    icon: (props) => <i className="fa-solid fa-fire-burner text-4xl text-amber-700" {...props}></i>,
  },
];

// --- Helper Functions ---
const getStoredData = <T,>(key: string, defaultValue: T): T => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.error(`Error reading from localStorage key “${key}”:`, error);
    return defaultValue;
  }
};

const setStoredData = <T,>(key: string, value: T) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Error writing to localStorage key “${key}”:`, error);
  }
};

const App = () => {
  // --- State ---
  const [showSplash, setShowSplash] = useState(true);
  const [reservations, setReservations] = useState<Reservation[]>(() => getStoredData('reservations', []));
  const [prices, setPrices] = useState<{ [key: string]: number }>(() => getStoredData('prices', initialPrices));
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [changeValuesModalOpen, setChangeValuesModalOpen] = useState(false);
  const [bookingModalState, setBookingModalState] = useState<{ open: boolean; space: Space | null }>({ open: false, space: null });
  const [confirmModalState, setConfirmModalState] = useState<{
    open: boolean;
    title: string;
    message: string;
    confirmText: string;
    onConfirm: (() => void) | null;
  }>({
    open: false,
    title: '',
    message: '',
    confirmText: 'Confirmar',
    onConfirm: null,
  });
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const [currentMonth, setCurrentMonth] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  
  const [selectedMonthFilter, setSelectedMonthFilter] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  // --- Effects ---
  useEffect(() => {
    const timer = setTimeout(() => setShowSplash(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    setStoredData('reservations', reservations);
  }, [reservations]);

  useEffect(() => {
    setStoredData('prices', prices);
  }, [prices]);
  
  // --- Memoized Values ---
  const filteredReservations = useMemo(() => {
      if (!selectedMonthFilter) return reservations;
      return reservations.filter(r => r.date.startsWith(selectedMonthFilter));
  }, [reservations, selectedMonthFilter]);

  const monthOptions = useMemo(() => {
      const options = [];
      const now = new Date();
      for (let i = -6; i <= 5; i++) {
          const date = new Date(now.getFullYear(), now.getMonth() + i, 1);
          const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          const label = date.toLocaleString('pt-BR', { month: 'long', year: 'numeric' });
          options.push({ value, label: label.charAt(0).toUpperCase() + label.slice(1) });
      }
      return options;
  }, []);

  // --- Handlers ---
  const handleOpenBookingModal = (space: Space) => {
    setCurrentMonth(new Date(today.getFullYear(), today.getMonth(), 1));
    setBookingModalState({ open: true, space });
  };
  
  const handleCloseBookingModal = () => setBookingModalState({ open: false, space: null });

  const handleCreateReservation = (date: string, apartment: string) => {
    if (!bookingModalState.space) return;
    const newReservation: Reservation = {
      id: crypto.randomUUID(),
      spaceName: bookingModalState.space.name,
      date,
      apartment,
      status: 'Pendente',
      value: prices[bookingModalState.space.name],
    };
    setReservations([...reservations, newReservation].sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime()));
    handleCloseBookingModal();
  };
  
  const handlePasswordCheck = (password: string) => {
    if (password === ADMIN_PASSWORD) {
      setIsAdminMode(true);
      setPasswordModalOpen(false);
    } else {
      alert('Senha incorreta!');
    }
  };
  
  const handleUpdatePrices = (newPrices: { [key: string]: number }) => {
    setPrices(newPrices);
    setChangeValuesModalOpen(false);
  };

  const confirmReservation = (id: string) => {
    setReservations(reservations.map(r => r.id === id ? { ...r, status: 'Confirmado' } : r));
  };
  
  const deleteReservation = (id: string) => {
    setConfirmModalState({
      open: true,
      title: 'Confirmar Exclusão',
      message: 'Tem certeza que deseja excluir esta reserva? Esta ação não pode ser desfeita.',
      confirmText: 'Excluir',
      onConfirm: () => { 
          setReservations(reservations.filter(r => r.id !== id));
          setConfirmModalState({ open: false, title: '', message: '', confirmText: 'Confirmar', onConfirm: null });
      }
    });
  };
  
  const handleSendReceipt = (reservation: Reservation) => {
    const formattedDate = new Date(reservation.date + 'T12:00:00Z').toLocaleDateString('pt-BR');
    const message = `Olá! Segue o comprovante de pagamento para a reserva do espaço "${reservation.spaceName}" no dia ${formattedDate}, para o apartamento ${reservation.apartment}.`;
    const whatsappUrl = `https://wa.me/${ADMIN_WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  // --- Components ---
  const SplashScreen = () => (
    <div className="fixed inset-0 bg-gradient-to-br from-green-400 to-yellow-300 flex items-center justify-center z-50 animate-fade-out" style={{ animationDelay: '2.5s' }}>
      <div className="text-center text-white animate-bounce-in">
        <i className="fas fa-home text-6xl mb-4"></i>
        <h1 className="text-4xl font-bold">Condomínio Villa Di Trento</h1>
        <p className="text-xl">Sistema de Reservas</p>
      </div>
    </div>
  );

  const Header = () => (
    <header className="sticky top-4 z-30 mx-4 mt-4 glassmorphism rounded-xl shadow-lg border-green-300/50 animate-slide-up">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <i className="fas fa-home text-3xl bg-clip-text text-transparent bg-gradient-to-r from-green-600 to-yellow-500 animate-pulse-subtle"></i>
          <h1 className="text-xl md:text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-green-800 to-yellow-600">
            Condomínio Villa Di Trento
          </h1>
        </div>
        <button
          onClick={() => isAdminMode ? setIsAdminMode(false) : setPasswordModalOpen(true)}
          className="bg-white/30 text-green-900 font-semibold py-2 px-4 rounded-lg shadow-md hover:bg-white/50 transition-all duration-300 transform hover:scale-105"
        >
          {isAdminMode ? '👨‍💼 Sair do Modo Síndico' : '🔐 Área do Síndico'}
        </button>
      </div>
    </header>
  );
  
  const StatCard = ({ icon, value, label, delay }: { icon: React.ReactNode, value: any, label: string, delay: number }) => (
      <div className="bg-white/50 p-4 rounded-xl shadow-md flex items-center gap-4 animate-slide-up" style={{'--delay': `${delay}s`}}>
          <div className="text-3xl text-green-700">{icon}</div>
          <div>
              <p className="text-2xl font-bold text-green-900">{value}</p>
              <p className="text-sm text-gray-600">{label}</p>
          </div>
      </div>
  );

  const StatsBanner = () => (
    <div className="my-6 p-4 rounded-xl bg-gradient-to-r from-green-200 to-yellow-200 animate-slide-up" style={{'--delay': '0.2s'}}>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard icon={<i className="fas fa-calendar-check"></i>} value={reservations.length} label="Total de Reservas" delay={0.4} />
            <StatCard icon={<i className="fas fa-building"></i>} value="2" label="Espaços Disponíveis" delay={0.6} />
            <StatCard icon={<i className="fas fa-users"></i>} value={spaces.reduce((acc, s) => acc + s.capacity, 0)} label="Capacidade Total" delay={0.8} />
        </div>
    </div>
  );

  // Fix: Explicitly type `SpaceCard` as `React.FC` to ensure correct JSX prop checking, which resolves assignment errors when components are used with a `key` prop in a list.
  const SpaceCard: React.FC<{ space: Space, delay: number }> = ({ space, delay }) => (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden group transform transition-transform duration-500 hover:-translate-y-2 animate-slide-up" style={{'--delay': `${delay}s`}}>
      <div className="relative">
        <img src={space.image} alt={space.name} className="w-full h-48 object-cover transition-transform duration-500 group-hover:scale-110" />
        <div className="absolute top-4 right-4 bg-gradient-to-br from-green-400 to-yellow-400 text-white font-bold py-1 px-3 rounded-full shadow-lg animate-pulse-subtle">
          R$ {prices[space.name].toFixed(2).replace('.', ',')}
        </div>
      </div>
      <div className="p-6">
        <div className="flex items-center gap-4 mb-3">
            <div className="transition-transform duration-500 group-hover:rotate-12">{space.icon({})}</div>
            <h3 className="text-2xl font-bold text-gray-800">{space.name}</h3>
        </div>
        <p className="text-gray-600 mb-4"><i className="fas fa-users mr-2 text-green-600"></i>Capacidade: {space.capacity} pessoas</p>
        <ul className="space-y-2 mb-6">
          {space.features.map(feat => (
            <li key={feat} className="flex items-center text-gray-700">
              <i className="fas fa-check-circle text-green-500 mr-2"></i>{feat}
            </li>
          ))}
        </ul>
        <button onClick={() => handleOpenBookingModal(space)} className="w-full bg-gradient-to-r from-green-500 to-yellow-500 text-white font-bold py-3 px-6 rounded-lg shadow-md hover:shadow-xl transform hover:scale-105 transition-all duration-300">
          <i className="fas fa-calendar-alt mr-2"></i>Reservar Agora
        </button>
      </div>
    </div>
  );
  
  const Calendar = ({ space, onSelectDate }: { space: Space, onSelectDate: (date: string) => void }) => {
    const today = new Date();
    today.setHours(0,0,0,0);

    const [currentMonth, setCurrentMonth] = useState(new Date(today.getFullYear(), today.getMonth(), 1));

    const nextMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
    const prevMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));

    const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
    const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay();
    const monthDays = Array.from({ length: daysInMonth }, (_, i) => new Date(currentMonth.getFullYear(), currentMonth.getMonth(), i + 1));
    
    const isBooked = (date: Date) => reservations.some(r => r.spaceName === space.name && r.date === date.toISOString().split('T')[0]);

    return (
        <div className="bg-white p-4 rounded-lg shadow-inner">
            <div className="flex justify-between items-center mb-4">
                <button onClick={prevMonth} className="p-2 rounded-full hover:bg-gray-100 transition"><i className="fas fa-chevron-left"></i></button>
                <h4 className="font-bold text-lg">{currentMonth.toLocaleString('pt-BR', { month: 'long', year: 'numeric' })}</h4>
                <button onClick={nextMonth} className="p-2 rounded-full hover:bg-gray-100 transition"><i className="fas fa-chevron-right"></i></button>
            </div>
            <div className="grid grid-cols-7 gap-1 text-center text-sm text-gray-500 mb-2">
                {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((day, i) => <div key={i}>{day}</div>)}
            </div>
            <div className="grid grid-cols-7 gap-1">
                {Array.from({ length: firstDayOfMonth }).map((_, i) => <div key={`empty-${i}`}></div>)}
                {monthDays.map(day => {
                    const dateString = day.toISOString().split('T')[0];
                    const booked = isBooked(day);
                    const isPast = day < today;
                    const isDisabled = booked || isPast;

                    return (
                        <button 
                            key={dateString}
                            onClick={() => onSelectDate(dateString)}
                            disabled={isDisabled}
                            className={`p-2 rounded-full transition-colors text-center ${
                                isDisabled 
                                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                : 'bg-green-100 text-green-800 hover:bg-green-500 hover:text-white'
                            }`}
                        >
                            {day.getDate()}
                        </button>
                    )
                })}
            </div>
        </div>
    );
  };
  
  const BookingModal = () => {
    const [apartment, setApartment] = useState('');
    const [selectedDate, setSelectedDate] = useState<string | null>(null);
    const [step, setStep] = useState(1);
    const [copySuccess, setCopySuccess] = useState('');
    
    if (!bookingModalState.open || !bookingModalState.space) return null;
    
    const handleConfirm = () => {
        if (selectedDate && apartment) {
            handleCreateReservation(selectedDate, apartment);
        }
    }

    const copyToClipboard = () => {
        navigator.clipboard.writeText(PIX_KEY_CNPJ_RAW).then(() => {
            setCopySuccess('Copiado com Sucesso!');
            setTimeout(() => setCopySuccess(''), 2000);
        }, () => {
            setCopySuccess('Falha ao copiar.');
        });
    }

    return (
        <div className="fixed inset-0 bg-black/60 z-40 flex items-center justify-center p-4" onClick={handleCloseBookingModal}>
            <div className="bg-gray-50 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto no-scrollbar animate-fade-in" onClick={e => e.stopPropagation()}>
                <div className="p-6">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-800">Reservar {bookingModalState.space.name}</h2>
                            <p className="text-gray-600">Valor: R$ {prices[bookingModalState.space.name].toFixed(2)}</p>
                        </div>
                        <button onClick={handleCloseBookingModal} className="text-gray-400 hover:text-gray-600">&times;</button>
                    </div>
                    
                    {step === 1 && (
                        <div>
                            <h3 className="font-semibold text-lg mb-2">1. Selecione a data e informe o apartamento</h3>
                            <Calendar space={bookingModalState.space} onSelectDate={setSelectedDate} />
                            {selectedDate && <p className="text-center my-2 font-semibold text-green-700">Data selecionada: {new Date(selectedDate+'T12:00:00Z').toLocaleDateString('pt-BR')}</p>}
                            <input
                                type="text"
                                value={apartment}
                                onChange={e => setApartment(e.target.value)}
                                placeholder="Número do Apartamento (ex: 101)"
                                className="w-full mt-4 p-3 border rounded-lg focus:ring-2 focus:ring-green-500"
                            />
                             <button onClick={() => setStep(2)} disabled={!selectedDate || !apartment} className="mt-4 w-full bg-green-600 text-white font-bold py-3 rounded-lg disabled:bg-gray-400 transition">
                                Próximo Passo
                            </button>
                        </div>
                    )}
                    
                    {step === 2 && (
                        <div>
                            <h3 className="font-semibold text-lg mb-2">2. Realize o pagamento via PIX</h3>
                            <div className="bg-gradient-to-br from-green-100 to-yellow-100 p-4 rounded-lg border-2 border-green-300 text-center relative">
                                <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-green-600 text-white text-xs font-bold px-3 py-1 rounded-full">Copie aqui</span>
                                <p className="text-sm text-gray-700 mb-2">Empresa: estasa empresa e serv. técnicos administrativos ltda</p>
                                <div className="bg-white border-2 border-dashed border-green-500 rounded-lg p-3 my-3">
                                    <p className="text-sm text-gray-500 mb-1">Chave PIX (CNPJ)</p>
                                    <p className="font-mono text-xl tracking-wider text-gray-800 break-all">{PIX_KEY_CNPJ_FORMATTED}</p>
                                    <p className="text-xs text-gray-500 mt-1">(Apenas números serão copiados para o seu app do banco)</p>
                                </div>
                                <button onClick={copyToClipboard} className="w-full bg-gradient-to-r from-green-500 to-yellow-500 text-white font-bold py-3 rounded-lg shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2">
                                    {copySuccess ? <><i className="fas fa-check"></i> {copySuccess}</> : <><i className="fas fa-copy"></i> Copiar Chave PIX</>}
                                </button>
                            </div>
                            <div className="mt-4 bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 rounded-md" role="alert">
                                <p className="font-bold">Atenção!</p>
                                <p>A reserva será confirmada após o envio do comprovante para o síndico e/ou subsíndico.</p>
                            </div>
                            <div className="flex gap-4 mt-4">
                                 <button onClick={() => setStep(1)} className="w-1/2 bg-gray-300 text-gray-800 font-bold py-3 rounded-lg transition">
                                    Voltar
                                </button>
                                <button onClick={handleConfirm} className="w-1/2 bg-green-600 text-white font-bold py-3 rounded-lg transition">
                                    Concluir Reserva
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
  };
  
  const ReservationsSection = () => (
    <section className="container mx-auto px-4 mt-10 animate-slide-up" style={{'--delay': '1s'}}>
      <div className="flex items-center gap-4 mb-4">
        <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-green-800 to-yellow-600">
          Reservas Confirmadas / Pendentes
        </h2>
        <span className="bg-green-200 text-green-800 text-sm font-semibold px-3 py-1 rounded-full">{filteredReservations.length}</span>
      </div>
      
      <div className="mb-6">
        <label htmlFor="month-filter" className="block text-sm font-medium text-gray-700 mb-1">Filtrar por mês:</label>
        <div className="relative">
            <select
                id="month-filter"
                value={selectedMonthFilter}
                onChange={(e) => setSelectedMonthFilter(e.target.value)}
                className="w-full md:w-72 p-3 pr-10 border-2 border-green-300 rounded-lg bg-white text-black appearance-none focus:outline-none focus:ring-2 focus:ring-green-500"
            >
                {monthOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                 <i className="fas fa-chevron-down"></i>
            </div>
        </div>
      </div>
      
      {filteredReservations.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredReservations.map(res => (
            <div key={res.id} className="bg-white rounded-xl shadow-md p-5 border-l-4" style={{borderColor: res.status === 'Confirmado' ? '#10B981' : '#F59E0B'}}>
              <div className="flex justify-between items-start">
                  <div>
                      <p className="font-bold text-lg text-gray-800">{res.spaceName}</p>
                      <p className={`text-sm font-semibold ${res.status === 'Confirmado' ? 'text-green-600' : 'text-amber-600'}`}>{res.status}</p>
                  </div>
                  <div className="flex gap-2 items-center">
                    {isAdminMode ? (
                        <>
                            {res.status === 'Pendente' && (
                                <button onClick={() => confirmReservation(res.id)} className="text-green-500 hover:text-green-700 p-1" title="Confirmar Reserva"><i className="fas fa-check-circle"></i></button>
                            )}
                            <button onClick={() => deleteReservation(res.id)} className="text-red-500 hover:text-red-700 p-1" title="Excluir Reserva"><i className="fas fa-trash"></i></button>
                        </>
                    ) : (
                       <>
                         {res.status === 'Pendente' && (
                            <button onClick={() => handleSendReceipt(res)} className="bg-green-500 text-white text-xs font-bold py-1 px-3 rounded-full hover:bg-green-600 transition flex items-center gap-1" title="Enviar Comprovante via WhatsApp">
                                <i className="fab fa-whatsapp"></i> Enviar Comprovante
                            </button>
                         )}
                       </>
                    )}
                  </div>
              </div>
              <div className="mt-4 space-y-2 text-gray-600">
                  <p><i className="fas fa-calendar-alt w-5"></i> {new Date(res.date+'T12:00:00Z').toLocaleDateString('pt-BR')}</p>
                  <p><i className="fas fa-home w-5"></i> Apto: {res.apartment}</p>
                  <p><i className="fas fa-dollar-sign w-5"></i> R$ {res.value.toFixed(2).replace('.', ',')}</p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-10 bg-white rounded-lg shadow-sm">
            <i className="fas fa-calendar-times text-4xl text-gray-400 mb-4"></i>
            <p className="text-gray-600">Nenhuma reserva encontrada para este mês.</p>
        </div>
      )}
    </section>
  );

  const PasswordModal = () => {
    const [password, setPassword] = useState('');
    if (!passwordModalOpen) return null;
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        handlePasswordCheck(password);
    }

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setPasswordModalOpen(false)}>
            <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-sm animate-fade-in" onClick={e => e.stopPropagation()}>
                <h3 className="text-xl font-bold mb-4">Acesso Restrito</h3>
                <form onSubmit={handleSubmit}>
                    <label htmlFor="password" className="block mb-2 text-sm font-medium text-gray-700">Senha do Síndico</label>
                    <input
                        type="password"
                        id="password"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        className="w-full p-2 border rounded-md focus:ring-2 focus:ring-green-500"
                        autoFocus
                    />
                    <button type="submit" className="mt-4 w-full bg-green-600 text-white font-bold py-2 rounded-md hover:bg-green-700 transition">Entrar</button>
                </form>
            </div>
        </div>
    );
  };
  
  const AdminDashboard = () => {
    const [activeTab, setActiveTab] = useState('overview');
    if (!isAdminMode) return null;

    const monthlyReport = useMemo(() => {
      const now = new Date();
      const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      const monthReservations = reservations.filter(r => r.date.startsWith(currentMonthStr));
      const confirmed = monthReservations.filter(r => r.status === 'Confirmado');
      const pending = monthReservations.filter(r => r.status === 'Pendente');
      const totalRevenue = confirmed.reduce((sum, r) => sum + r.value, 0);

      return {
          total: monthReservations.length,
          confirmed: confirmed.length,
          pending: pending.length,
          revenue: totalRevenue.toFixed(2).replace('.', ','),
      }
    }, [reservations]);
    
    const pendingReservations = reservations.filter(r => r.status === 'Pendente');

    const TabButton = ({ tabName, label }: { tabName: string, label: string }) => (
        <button
            onClick={() => setActiveTab(tabName)}
            className={`py-3 px-4 text-sm font-medium transition-colors duration-300 focus:outline-none ${
                activeTab === tabName
                    ? 'border-b-2 border-green-600 text-green-700'
                    : 'text-gray-500 hover:text-gray-700 border-b-2 border-transparent'
            }`}
        >
            {label}
        </button>
    );

    const MonthlyStatCard = ({ title, value, color, border }: { title: string, value: string | number, color: string, border: string }) => (
        <div className={`p-4 rounded-lg shadow-sm border ${border} ${color}`}>
            <p className="text-sm text-gray-600">{title}</p>
            <p className="text-3xl font-bold text-gray-800">{value}</p>
        </div>
    );

    return (
        <div className="container mx-auto px-4 my-8 animate-fade-in">
            <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-200">
                <div className="flex flex-wrap justify-between items-center gap-4">
                    <h2 className="text-3xl font-bold text-green-800">Painel Administrativo</h2>
                    <div className="flex items-center gap-3">
                        <button className="flex items-center gap-2 bg-white border border-green-300 text-green-800 font-semibold py-2 px-4 rounded-lg shadow-sm hover:bg-green-50 transition">
                            <i className="fas fa-cog"></i> Config. Lembretes
                        </button>
                        <button 
                            onClick={() => setChangeValuesModalOpen(true)} 
                            className="flex items-center gap-2 bg-gradient-to-r from-green-600 to-lime-500 text-white font-bold py-2 px-4 rounded-lg shadow-md hover:shadow-lg transition-transform transform hover:scale-105"
                        >
                           <i className="fas fa-dollar-sign"></i> Alterar Valores
                        </button>
                    </div>
                </div>

                <div className="border-b border-gray-200 mt-6">
                    <nav className="-mb-px flex gap-6" aria-label="Tabs">
                        <TabButton tabName="overview" label="Visão Geral" />
                        <TabButton tabName="payments" label="Confirmar Pagamentos" />
                        <TabButton tabName="reservations" label="Reservas" />
                        <TabButton tabName="reminders" label="Lembretes" />
                    </nav>
                </div>
                
                <div className="mt-6">
                    {activeTab === 'overview' && (
                        <div className="animate-fade-in">
                            <h3 className="text-xl font-bold text-gray-800 mb-4">Relatório Mensal</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                <MonthlyStatCard title="Total de Reservas" value={monthlyReport.total} color="bg-green-50" border="border-green-200" />
                                <MonthlyStatCard title="Pendentes" value={monthlyReport.pending} color="bg-yellow-50" border="border-yellow-200" />
                                <MonthlyStatCard title="Confirmadas" value={monthlyReport.confirmed} color="bg-green-50" border="border-green-200" />
                                <MonthlyStatCard title="Receita Total" value={`R$ ${monthlyReport.revenue}`} color="bg-green-50" border="border-green-200" />
                            </div>
                            
                            <h3 className="text-xl font-bold text-gray-800 mt-8 mb-4">Valores Atuais</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="p-6 rounded-xl shadow-lg bg-gradient-to-br from-green-500 to-teal-600 text-white relative overflow-hidden">
                                    <h4 className="font-semibold">Salão de Festas</h4>
                                    <p className="text-4xl font-bold mt-1">R$ {prices['Salão de Festas'].toFixed(2).replace('.', ',')}</p>
                                    <i className="fa-solid fa-wand-magic-sparkles text-7xl absolute -right-3 -bottom-3 text-white/20 transform rotate-12"></i>
                                </div>
                                <div className="p-6 rounded-xl shadow-lg bg-gradient-to-br from-amber-500 to-orange-500 text-white relative overflow-hidden">
                                    <h4 className="font-semibold">Churrasqueira</h4>
                                    <p className="text-4xl font-bold mt-1">R$ {prices['Churrasqueira'].toFixed(2).replace('.', ',')}</p>
                                     <i className="fa-solid fa-fire text-7xl absolute -right-3 -bottom-3 text-white/20 transform -rotate-12"></i>
                                </div>
                            </div>
                             <p className="text-sm text-gray-600 mt-6"><i className="fas fa-exclamation-triangle text-yellow-500 mr-2"></i>Alterações nos valores se aplicam apenas a novas reservas.</p>
                        </div>
                    )}
                    {activeTab === 'payments' && (
                        <div className="animate-fade-in">
                            <h3 className="text-xl font-bold text-gray-800 mb-4">Confirmar Pagamentos Pendentes</h3>
                             {pendingReservations.length > 0 ? (
                                <div className="space-y-4">
                                    {pendingReservations.map(res => (
                                        <div key={res.id} className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded-r-lg flex flex-wrap justify-between items-center gap-4">
                                            <div>
                                                <p className="font-bold">{res.spaceName} - Apto: {res.apartment}</p>
                                                <p className="text-sm text-gray-600">{new Date(res.date+'T12:00:00Z').toLocaleDateString('pt-BR')} - R$ {res.value.toFixed(2).replace('.', ',')}</p>
                                            </div>
                                            <button onClick={() => confirmReservation(res.id)} className="bg-green-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-green-600 transition">
                                                <i className="fas fa-check mr-2"></i>Confirmar
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-gray-500">Nenhum pagamento pendente.</p>
                            )}
                        </div>
                    )}
                    {activeTab === 'reservations' && (
                        <div className="animate-fade-in">
                             <h3 className="text-xl font-bold text-gray-800 mb-4">Todas as Reservas</h3>
                             {reservations.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {reservations.map(res => (
                                    <div key={res.id} className="bg-white rounded-xl shadow-md p-5 border-l-4" style={{borderColor: res.status === 'Confirmado' ? '#10B981' : '#F59E0B'}}>
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <p className="font-bold text-lg text-gray-800">{res.spaceName}</p>
                                                <p className={`text-sm font-semibold ${res.status === 'Confirmado' ? 'text-green-600' : 'text-amber-600'}`}>{res.status}</p>
                                            </div>
                                            <div className="flex gap-2">
                                                {res.status === 'Pendente' && (
                                                <button onClick={() => confirmReservation(res.id)} className="text-green-500 hover:text-green-700 p-1" title="Confirmar Reserva"><i className="fas fa-check-circle"></i></button>
                                                )}
                                                <button onClick={() => deleteReservation(res.id)} className="text-red-500 hover:text-red-700 p-1" title="Excluir Reserva"><i className="fas fa-trash"></i></button>
                                            </div>
                                        </div>
                                        <div className="mt-4 space-y-2 text-gray-600">
                                            <p><i className="fas fa-calendar-alt w-5"></i> {new Date(res.date+'T12:00:00Z').toLocaleDateString('pt-BR')}</p>
                                            <p><i className="fas fa-home w-5"></i> Apto: {res.apartment}</p>
                                            <p><i className="fas fa-dollar-sign w-5"></i> R$ {res.value.toFixed(2).replace('.', ',')}</p>
                                        </div>
                                    </div>
                                ))}
                                </div>
                            ) : (
                                <p className="text-gray-500">Nenhuma reserva encontrada.</p>
                            )}
                        </div>
                    )}
                    {activeTab === 'reminders' && (
                        <div className="animate-fade-in text-center p-8 bg-gray-50 rounded-lg">
                            <i className="fas fa-tools text-4xl text-gray-400 mb-4"></i>
                            <h3 className="text-xl font-bold text-gray-800">Em Breve</h3>
                            <p className="text-gray-500 mt-2">A funcionalidade de configuração de lembretes está em desenvolvimento.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
  };
  
  const ChangeValuesModal = () => {
    const [tempPrices, setTempPrices] = useState(prices);
    if (!changeValuesModalOpen) return null;

    const handlePriceChange = (spaceName: string, value: string) => {
        const numValue = parseFloat(value.replace(',', '.'));
        if (!isNaN(numValue) && numValue >= 0) {
            setTempPrices({ ...tempPrices, [spaceName]: numValue });
        }
    }
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        handleUpdatePrices(tempPrices);
    }

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setChangeValuesModalOpen(false)}>
            <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-md animate-fade-in" onClick={e => e.stopPropagation()}>
                <h3 className="text-xl font-bold mb-4">Alterar Valores de Reserva</h3>
                <p className="text-sm text-gray-600 mb-4">Os novos valores serão aplicados apenas para futuras reservas.</p>
                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label htmlFor="salao-price" className="block mb-2 text-sm font-medium text-gray-700">Salão de Festas</label>
                        <div className="relative">
                            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">R$</span>
                            <input
                                type="text"
                                id="salao-price"
                                value={String(tempPrices['Salão de Festas']).replace('.', ',')}
                                onChange={e => handlePriceChange('Salão de Festas', e.target.value)}
                                className="w-full p-2 pl-10 border rounded-md focus:ring-2 focus:ring-green-500"
                            />
                        </div>
                    </div>
                    <div className="mb-6">
                        <label htmlFor="churrasqueira-price" className="block mb-2 text-sm font-medium text-gray-700">Churrasqueira</label>
                         <div className="relative">
                            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">R$</span>
                            <input
                                type="text"
                                id="churrasqueira-price"
                                value={String(tempPrices['Churrasqueira']).replace('.', ',')}
                                onChange={e => handlePriceChange('Churrasqueira', e.target.value)}
                                className="w-full p-2 pl-10 border rounded-md focus:ring-2 focus:ring-green-500"
                            />
                        </div>
                    </div>
                    <div className="flex gap-4">
                         <button type="button" onClick={() => setChangeValuesModalOpen(false)} className="w-1/2 bg-gray-300 text-gray-800 font-bold py-2 rounded-md hover:bg-gray-400 transition">Cancelar</button>
                         <button type="submit" className="w-1/2 bg-green-600 text-white font-bold py-2 rounded-md hover:bg-green-700 transition">Salvar</button>
                    </div>
                </form>
            </div>
        </div>
    );
  };
  
    const ConfirmationModal = () => {
    const { open, title, message, confirmText, onConfirm } = confirmModalState;

    if (!open) return null;

    const handleClose = () => {
        setConfirmModalState({ open: false, title: '', message: '', confirmText: 'Confirmar', onConfirm: null });
    };

    const handleConfirm = () => {
        if (onConfirm) {
            onConfirm();
        }
        handleClose();
    };

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={handleClose}>
            <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm animate-fade-in text-center" onClick={e => e.stopPropagation()}>
                <div className="text-red-500 mb-4">
                    <i className="fas fa-exclamation-triangle text-5xl"></i>
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">{title}</h3>
                <p className="text-gray-600 mb-8">{message}</p>
                <div className="flex gap-4 justify-center">
                    <button onClick={handleClose} className="w-full px-6 py-3 bg-gray-200 text-gray-800 font-bold rounded-lg hover:bg-gray-300 transition">
                        Cancelar
                    </button>
                    <button onClick={handleConfirm} className="w-full px-6 py-3 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 transition">
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
  };

  if (showSplash) {
    return <SplashScreen />;
  }

  return (
    <div className="min-h-screen">
      <Header />
      <main className="pb-10">
        <div className="container mx-auto px-4">
          {!isAdminMode && <StatsBanner />}
          <AdminDashboard />
          {!isAdminMode && <div className="grid md:grid-cols-2 gap-8 mt-8">
            {spaces.map((space, index) => <SpaceCard key={space.id} space={space} delay={1 + index * 0.2} />)}
          </div>}
        </div>
        {!isAdminMode && <ReservationsSection />}
      </main>
      
      <BookingModal />
      <PasswordModal />
      <ChangeValuesModal />
      <ConfirmationModal />
    </div>
  );
};

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);
root.render(<App />);