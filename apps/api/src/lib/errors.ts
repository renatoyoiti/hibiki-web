export class AppError extends Error {
  constructor(
    public readonly code: string,
    public readonly message: string,
    public readonly statusCode: number,
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export const Errors = {
  invalidFileFormat: () =>
    new AppError(
      'INVALID_FILE_FORMAT',
      'Formato de arquivo não suportado. Use .mp3, .wav ou .mp4',
      422,
    ),
  fileTooLarge: () =>
    new AppError('FILE_TOO_LARGE', 'O arquivo excede o limite de 5MB', 422),
  soundAlreadyActive: () =>
    new AppError(
      'SOUND_ALREADY_ACTIVE',
      'Este som já está na fila de execução',
      409,
    ),
  presetNotFound: () =>
    new AppError('PRESET_NOT_FOUND', 'Preset não encontrado ou removido', 404),
  soundNotFound: () =>
    new AppError('SOUND_NOT_FOUND', 'Som não encontrado ou removido', 404),
  internal: (message = 'Erro interno do servidor') =>
    new AppError('INTERNAL_ERROR', message, 500),
  serviceUnavailable: () =>
    new AppError(
      'SERVICE_UNAVAILABLE',
      'Serviço temporariamente indisponível',
      503,
    ),
};
