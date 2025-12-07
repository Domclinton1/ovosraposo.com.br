import { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CreditCard, Calendar, Lock } from "lucide-react";
import { z } from "zod";
import { MERCADO_PAGO_PUBLIC_KEY } from "@/config/mercadoPago";

declare global {
  interface Window {
    MercadoPago: any;
  }
}

const cardSchema = z.object({
  cardNumber: z.string()
    .transform((val) => val.replace(/\s/g, ""))
    .refine((val) => /^\d{13,19}$/.test(val), {
      message: "Número de cartão inválido"
    }),
  cardholderName: z.string()
    .trim()
    .min(3, "Nome deve ter pelo menos 3 caracteres")
    .max(100, "Nome muito longo")
    .refine((val) => /^[a-zA-ZÀ-ÿ\s]+$/.test(val), {
      message: "Nome deve conter apenas letras"
    }),
  expirationMonth: z.string()
    .refine((val) => /^(0[1-9]|1[0-2])$/.test(val), {
      message: "Mês inválido"
    }),
  expirationYear: z.string()
    .refine((val) => {
      const year = parseInt(val);
      const currentYear = new Date().getFullYear();
      return year >= currentYear && year <= currentYear + 20;
    }, {
      message: "Ano inválido"
    }),
  securityCode: z.string()
    .refine((val) => /^\d{3,4}$/.test(val), {
      message: "CVV deve ter 3 ou 4 dígitos"
    }),
  identificationType: z.string().min(1, "Selecione o tipo de documento"),
  identificationNumber: z.string()
    .transform((val) => val.replace(/\D/g, ""))
    .refine((val) => val.length === 11 || val.length === 14, {
      message: "CPF deve ter 11 dígitos ou CNPJ 14 dígitos"
    }),
});

interface CardPaymentFormProps {
  paymentMethod: string;
  onTokenGenerated: (
    token: string, 
    paymentMethodId: string, 
    issuer: string,
    identificationType: string,
    identificationNumber: string
  ) => void;
  onError: (error: string) => void;
}

export const CardPaymentForm = ({ paymentMethod, onTokenGenerated, onError }: CardPaymentFormProps) => {
  const [mp, setMp] = useState<any>(null);
  const [cardData, setCardData] = useState({
    cardNumber: "",
    cardholderName: "",
    expirationMonth: "",
    expirationYear: "",
    securityCode: "",
    identificationType: "CPF",
    identificationNumber: "",
  });
  const [cardBrand, setCardBrand] = useState<string>("");
  const [isValidating, setIsValidating] = useState(false);

  useEffect(() => {
    // Inicializar Mercado Pago SDK
    if (!MERCADO_PAGO_PUBLIC_KEY) {
      console.error("Chave pública do Mercado Pago não configurada em src/config/mercadoPago.ts");
      return;
    }

    if (window.MercadoPago) {
      const mercadopago = new window.MercadoPago(MERCADO_PAGO_PUBLIC_KEY);
      setMp(mercadopago);
      console.log("Mercado Pago SDK inicializado com sucesso");
    } else {
      console.error("SDK do Mercado Pago não encontrado no window");
    }
  }, []);

  const formatCardNumber = (value: string) => {
    return value
      .replace(/\s/g, "")
      .replace(/(\d{4})/g, "$1 ")
      .trim()
      .substring(0, 19);
  };

  const formatCPF = (value: string) => {
    return value
      .replace(/\D/g, "")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{1,2})$/, "$1-$2")
      .substring(0, 14);
  };

  const handleCardNumberChange = async (value: string) => {
    const formatted = formatCardNumber(value);
    setCardData({ ...cardData, cardNumber: formatted });

    // Detectar bandeira do cartão
    const cleanNumber = value.replace(/\s/g, "");
    if (cleanNumber.length >= 6 && mp) {
      try {
        const bin = cleanNumber.substring(0, 6);
        const paymentMethods = await mp.getPaymentMethods({ bin });
        
        if (paymentMethods.results && paymentMethods.results.length > 0) {
          const method = paymentMethods.results[0];
          setCardBrand(method.name);
        }
      } catch (error) {
        console.error("Erro ao detectar bandeira:", error);
      }
    } else {
      setCardBrand("");
    }
  };

  const handleIdentificationChange = (value: string) => {
    let formatted = value;
    if (cardData.identificationType === "CPF") {
      formatted = formatCPF(value);
    } else {
      formatted = value.replace(/\D/g, "").substring(0, 14);
    }
    setCardData({ ...cardData, identificationNumber: formatted });
  };

  const generateToken = async () => {
    if (!mp) {
      onError("SDK do Mercado Pago não carregado");
      return null;
    }

    setIsValidating(true);

    try {
      // Validar dados do cartão
      const validatedData = cardSchema.parse({
        ...cardData,
        expirationYear: cardData.expirationYear ? `20${cardData.expirationYear}` : "",
      });

      console.log("Gerando token do cartão...");

      // Criar token do cartão
      const cardToken = await mp.createCardToken({
        cardNumber: validatedData.cardNumber,
        cardholderName: validatedData.cardholderName,
        cardExpirationMonth: validatedData.expirationMonth,
        cardExpirationYear: validatedData.expirationYear,
        securityCode: validatedData.securityCode,
        identificationType: validatedData.identificationType,
        identificationNumber: validatedData.identificationNumber,
      });

      if (cardToken.error) {
        throw new Error(cardToken.error.message || "Erro ao gerar token do cartão");
      }

      console.log("Token gerado com sucesso:", cardToken.id);
      
      // Buscar informações do método de pagamento
      const bin = validatedData.cardNumber.substring(0, 6);
      const paymentMethods = await mp.getPaymentMethods({ bin });
      
      if (!paymentMethods.results || paymentMethods.results.length === 0) {
        throw new Error("Método de pagamento não encontrado");
      }

      const paymentMethodInfo = paymentMethods.results[0];
      
      const tokenData = {
        token: cardToken.id,
        paymentMethodId: paymentMethodInfo.id,
        issuerId: paymentMethodInfo.issuer?.id || "",
        identificationType: validatedData.identificationType,
        identificationNumber: validatedData.identificationNumber,
      };

      onTokenGenerated(
        cardToken.id,
        paymentMethodInfo.id,
        paymentMethodInfo.issuer?.id || "",
        validatedData.identificationType,
        validatedData.identificationNumber
      );

      return tokenData;
    } catch (error) {
      console.error("Erro na validação/tokenização:", error);
      if (error instanceof z.ZodError) {
        const firstError = error.issues[0];
        onError(firstError.message);
      } else if (error instanceof Error) {
        onError(error.message);
      } else {
        onError("Erro ao processar dados do cartão");
      }
      return null;
    } finally {
      setIsValidating(false);
    }
  };

  // Expor função generateToken para o componente pai
  useEffect(() => {
    (window as any).generateCardToken = generateToken;
  }, [cardData, mp]);

  const currentYear = new Date().getFullYear() % 100;
  const years = Array.from({ length: 20 }, (_, i) => currentYear + i);

  return (
    <div className="space-y-4 bg-muted/20 p-4 rounded-lg border border-border">
      <div className="flex items-center gap-2 mb-4">
        <CreditCard className="w-5 h-5 text-primary" />
        <h3 className="font-semibold">
          Dados do Cartão {paymentMethod === "debit_card" ? "de Débito" : "de Crédito"}
        </h3>
      </div>

      {!mp && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3 text-sm text-yellow-800 dark:text-yellow-200">
          Carregando sistema de pagamento...
        </div>
      )}

      <div className="space-y-4">
        {/* Número do Cartão */}
        <div>
          <Label htmlFor="cardNumber">Número do Cartão</Label>
          <div className="relative">
            <Input
              id="cardNumber"
              type="text"
              placeholder="0000 0000 0000 0000"
              value={cardData.cardNumber}
              onChange={(e) => handleCardNumberChange(e.target.value)}
              maxLength={19}
              className="pr-20"
            />
            {cardBrand && (
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-muted-foreground">
                {cardBrand}
              </span>
            )}
          </div>
        </div>

        {/* Nome no Cartão */}
        <div>
          <Label htmlFor="cardholderName">Nome no Cartão</Label>
          <Input
            id="cardholderName"
            type="text"
            placeholder="Como está impresso no cartão"
            value={cardData.cardholderName}
            onChange={(e) => setCardData({ ...cardData, cardholderName: e.target.value.toUpperCase() })}
            maxLength={100}
          />
        </div>

        {/* Validade e CVV */}
        <div className="grid grid-cols-3 gap-3">
          <div>
            <Label htmlFor="expirationMonth">
              <Calendar className="w-4 h-4 inline mr-1" />
              Mês
            </Label>
            <Select
              value={cardData.expirationMonth}
              onValueChange={(value) => setCardData({ ...cardData, expirationMonth: value })}
            >
              <SelectTrigger id="expirationMonth">
                <SelectValue placeholder="MM" />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 12 }, (_, i) => {
                  const month = String(i + 1).padStart(2, "0");
                  return (
                    <SelectItem key={month} value={month}>
                      {month}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="expirationYear">Ano</Label>
            <Select
              value={cardData.expirationYear}
              onValueChange={(value) => setCardData({ ...cardData, expirationYear: value })}
            >
              <SelectTrigger id="expirationYear">
                <SelectValue placeholder="AA" />
              </SelectTrigger>
              <SelectContent>
                {years.map((year) => (
                  <SelectItem key={year} value={String(year)}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="securityCode">
              <Lock className="w-4 h-4 inline mr-1" />
              CVV
            </Label>
            <Input
              id="securityCode"
              type="text"
              placeholder="123"
              value={cardData.securityCode}
              onChange={(e) => setCardData({ ...cardData, securityCode: e.target.value.replace(/\D/g, "") })}
              maxLength={4}
            />
          </div>
        </div>

        {/* CPF/CNPJ do Titular */}
        <div className="grid grid-cols-3 gap-3">
          <div>
            <Label htmlFor="identificationType">Documento</Label>
            <Select
              value={cardData.identificationType}
              onValueChange={(value) => setCardData({ ...cardData, identificationType: value, identificationNumber: "" })}
            >
              <SelectTrigger id="identificationType">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="CPF">CPF</SelectItem>
                <SelectItem value="CNPJ">CNPJ</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="col-span-2">
            <Label htmlFor="identificationNumber">
              {cardData.identificationType === "CPF" ? "CPF" : "CNPJ"} do Titular
            </Label>
            <Input
              id="identificationNumber"
              type="text"
              placeholder={cardData.identificationType === "CPF" ? "000.000.000-00" : "00.000.000/0000-00"}
              value={cardData.identificationNumber}
              onChange={(e) => handleIdentificationChange(e.target.value)}
              maxLength={cardData.identificationType === "CPF" ? 14 : 18}
            />
          </div>
        </div>

        {/* Aviso de Segurança */}
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3 flex items-start gap-2">
          <Lock className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
          <p className="text-xs text-green-800 dark:text-green-200">
            Seus dados de pagamento são processados de forma segura. Não armazenamos informações do seu cartão.
          </p>
        </div>
      </div>
    </div>
  );
};
