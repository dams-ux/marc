import torch
import torch.nn as nn
import matplotlib.pyplot as plt

# 1. Données d'entraînement
# x: Entrées, y: Sorties
x = torch.linspace(0, 10, 100).unsqueeze(1)
y = 2 * x + 1 + 0.5 * torch.randn_like(x)  # y = 2x + 1 avec du bruit

# 2. Définir le modèle
class ModeleLineaire(nn.Module):
    def __init__(self):
        super(ModeleLineaire, self).__init__()
        self.linear = nn.Linear(1, 1)  # une entrée, une sortie

    def forward(self, x):
        return self.linear(x)

model = ModeleLineaire()

# 3. Fonction de perte et optimiseur
criterion = nn.MSELoss()
optimizer = torch.optim.SGD(model.parameters(), lr=0.01)

# 4. Entraînement du modèle
for epoch in range(300):
    y_pred = model(x)
    loss = criterion(y_pred, y)

    optimizer.zero_grad()
    loss.backward()
    optimizer.step()

    if epoch % 50 == 0:
        print(f"Epoch {epoch}, Perte: {loss.item():.4f}")

# 5. Affichage des résultats
predicted = model(x).detach()

plt.scatter(x.numpy(), y.numpy(), label='Données réelles')
plt.plot(x.numpy(), predicted.numpy(), color='red', label='Prédiction')
plt.legend()
plt.title("Régresseur linéaire entraîné par PyTorch")
plt.show()
