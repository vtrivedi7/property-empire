# Property Puzzle Empire

A modern web-based property management game where players can build and manage their real estate empire.

## Live Demo

The game is deployed and available at: [https://v0-property-puzzle-empire.vercel.app/](https://v0-property-puzzle-empire.vercel.app/)

## Local Development

### Prerequisites

- Node.js (v18 or higher)
- npm (v9 or higher)

### Setup and Running

1. Clone the repository
2. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Start the development server:
   ```bash
   npm run dev
   ```
5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Design Choices and Technical Stack

### Frontend Framework
- **Next.js**: Chosen for its excellent developer experience, built-in routing, and server-side rendering capabilities. The App Router provides a more intuitive and flexible way to structure the application.

### UI Components
- **Radix UI**: Used for accessible, unstyled components that provide a solid foundation for building custom UI elements.
- **Tailwind CSS**: Implemented for utility-first styling, enabling rapid development and consistent design.
- **Framer Motion**: Integrated for smooth animations and transitions, enhancing the user experience.

### State Management
- **Zustand**: Selected for its simplicity and performance. It provides a lightweight solution for managing global state without the complexity of larger state management libraries.

### Form Handling
- **React Hook Form**: Implemented for efficient form handling with minimal re-renders and built-in validation.
- **Zod**: Used for runtime type checking and validation, ensuring data integrity throughout the application.

### Development Tools
- **TypeScript**: Adopted for type safety and better developer experience.
- **ESLint**: Configured for code quality and consistency.
- **PostCSS**: Used for processing CSS with Tailwind CSS.

### Deployment
- **Vercel**: Chosen for its seamless integration with Next.js, providing automatic deployments, preview environments, and excellent performance.

## Project Structure

```
frontend/
├── app/           # Next.js app router pages and layouts
├── components/    # Reusable UI components
├── lib/          # Utility functions and shared logic
├── hooks/        # Custom React hooks
├── types/        # TypeScript type definitions
├── styles/       # Global styles and Tailwind configuration
└── public/       # Static assets
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details. 