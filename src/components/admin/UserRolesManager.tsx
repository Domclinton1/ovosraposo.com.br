import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { UserPlus, Trash2 } from "lucide-react";

interface UserRole {
  id: string;
  user_id: string;
  role: string;
  created_at: string;
}

interface Profile {
  user_id: string;
  full_name: string;
  email: string;
  phone: string;
  roles: string[];
}

const UserRolesManager = () => {
  const { toast } = useToast();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserRole, setNewUserRole] = useState<string>("expedition");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('manage-users', {
        body: { action: 'listUsers' }
      });

      if (error) throw error;

      // Filter to show only staff users (users with admin, expedition, or logistics roles)
      const staffUsers = data.users
        .filter((user: any) => {
          const roles = user.roles || [];
          return roles.some((role: string) => 
            ['admin', 'expedition', 'logistics'].includes(role)
          );
        })
        .map((user: any) => ({
          user_id: user.id,
          full_name: user.profile?.full_name || user.email?.split('@')[0] || 'Sem nome',
          email: user.email || '',
          phone: user.profile?.phone || '',
          roles: user.roles || []
        }));

      setProfiles(staffUsers);
    } catch (error) {
      console.error("Error loading users:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os usuários.",
        variant: "destructive",
      });
    }
  };

  const addRoleToUser = async (userId: string, role: string) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from("user_roles")
        .insert([{ user_id: userId, role: role as any }]);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Role adicionada com sucesso!",
      });

      loadUsers();
    } catch (error) {
      console.error("Error adding role:", error);
      toast({
        title: "Erro",
        description: "Não foi possível adicionar a role.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const removeRoleFromUser = async (userId: string, role: string) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from("user_roles")
        .delete()
        .eq("user_id", userId)
        .eq("role", role as any);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Role removida com sucesso!",
      });

      loadUsers();
    } catch (error) {
      console.error("Error removing role:", error);
      toast({
        title: "Erro",
        description: "Não foi possível remover a role.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createUserWithRole = async () => {
    if (!newUserEmail) {
      toast({
        title: "Erro",
        description: "Preencha o email do usuário.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('manage-users', {
        body: { 
          action: 'createUser',
          email: newUserEmail,
          role: newUserRole
        }
      });

      if (error) throw error;

      toast({
        title: "Usuário criado!",
        description: `Um email foi enviado para ${newUserEmail} para definir a senha.`,
      });

      setNewUserEmail("");
      loadUsers();
    } catch (error: any) {
      console.error("Error creating user:", error);
      toast({
        title: "Erro",
        description: error.message || "Não foi possível criar o usuário.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case "admin":
        return "default";
      case "expedition":
        return "secondary";
      case "logistics":
        return "outline";
      default:
        return "outline";
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case "admin":
        return "Admin";
      case "expedition":
        return "Expedição";
      case "logistics":
        return "Logística";
      case "customer":
        return "Cliente";
      default:
        return role;
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Criar Novo Usuário Staff</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="col-span-2">
              <Label>Email</Label>
              <Input
                type="email"
                value={newUserEmail}
                onChange={(e) => setNewUserEmail(e.target.value)}
                placeholder="usuario@exemplo.com"
              />
            </div>
            <div>
              <Label>Role</Label>
              <Select value={newUserRole} onValueChange={setNewUserRole}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="expedition">Expedição</SelectItem>
                  <SelectItem value="logistics">Logística</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button
            onClick={createUserWithRole}
            disabled={loading}
            className="mt-4"
          >
            <UserPlus className="h-4 w-4 mr-2" />
            Criar Usuário
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Gerenciar Roles dos Usuários</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {profiles.map((profile) => (
              <Card key={profile.user_id}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold">{profile.full_name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {profile.email}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {profile.phone}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {profile.roles.length > 0 ? (
                        profile.roles.map((role) => (
                          <Badge
                            key={role}
                            variant={getRoleBadgeVariant(role)}
                            className="flex items-center gap-1"
                          >
                            {getRoleLabel(role)}
                            <button
                              onClick={() =>
                                removeRoleFromUser(profile.user_id, role)
                              }
                              className="ml-1 hover:text-destructive"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </Badge>
                        ))
                      ) : (
                        <Badge variant="outline">Nenhuma role</Badge>
                      )}
                    </div>
                  </div>
                  <div className="mt-4 flex gap-2">
                    {!profile.roles.includes("admin") && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => addRoleToUser(profile.user_id, "admin")}
                        disabled={loading}
                      >
                        + Admin
                      </Button>
                    )}
                    {!profile.roles.includes("expedition") && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          addRoleToUser(profile.user_id, "expedition")
                        }
                        disabled={loading}
                      >
                        + Expedição
                      </Button>
                    )}
                    {!profile.roles.includes("logistics") && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          addRoleToUser(profile.user_id, "logistics")
                        }
                        disabled={loading}
                      >
                        + Logística
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default UserRolesManager;